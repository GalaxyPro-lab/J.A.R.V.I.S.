import json
import uuid
from typing import AsyncGenerator, Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.models import Message, ToolCallLog
from backend.ai.ollama_client import ollama_client
from backend.ai.prompt_builder import prompt_builder
from backend.skills.registry import skill_registry
from backend.mcp.client import mcp_manager
from backend.security.permissions import get_tool_permission_level, requires_user_confirmation, PermissionLevel

class AIOrchestrator:
    async def process_chat(
        self,
        db: AsyncSession,
        chat_id: str,
        user_message: str,
        attachments: Optional[List[Dict[str, Any]]] = None,
        security_mode: str = "balanced",
        model_override: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Robust multi-turn reasoning and tool execution loop.
        """
        # 1. Save user message to database
        user_msg = Message(
            id=str(uuid.uuid4()),
            chat_id=chat_id,
            role="user",
            content=user_message,
            attachments=attachments or []
        )
        db.add(user_msg)
        await db.commit()
        await db.refresh(user_msg)

        yield {
            "type": "user_message_saved",
            "message_id": user_msg.id,
            "content": user_message
        }

        # 2. Build isolated context
        context = await prompt_builder.build_context(db, chat_id)
        model = model_override or context["model"]
        messages = list(context["messages"])
        options = {
            "temperature": context["temperature"],
            "top_p": context["top_p"]
        }

        # 3. Collect tools
        skills_tools = skill_registry.get_tools_for_skills(context["enabled_skills"])
        mcp_tools = await mcp_manager.get_tools_for_servers(context["enabled_mcp_servers"])
        available_tools = skills_tools + mcp_tools

        tool_execution_cycles = 0
        max_tool_cycles = 4
        final_assistant_content = ""

        while tool_execution_cycles < max_tool_cycles:
            tool_execution_cycles += 1
            current_turn_content = ""
            detected_tool_calls = []

            yield {"type": "status", "status": "thinking", "model": model}

            # If we already ran a tool in a previous cycle, we can prompt for final synthesis
            pass_tools = available_tools if (available_tools and tool_execution_cycles == 1) else None

            async for chunk in ollama_client.chat_stream(
                model=model,
                messages=messages,
                tools=pass_tools,
                options=options
            ):
                chunk_type = chunk.get("type")

                if chunk_type == "content":
                    delta = chunk.get("delta", "")
                    current_turn_content += delta
                    final_assistant_content += delta
                    yield {
                        "type": "token",
                        "delta": delta,
                        "content": final_assistant_content
                    }

                elif chunk_type == "tool_calls":
                    t_calls = chunk.get("delta", [])
                    detected_tool_calls.extend(t_calls)

                elif chunk_type == "error":
                    err_msg = chunk.get("delta", "Errore sconosciuto")
                    yield {
                        "type": "error",
                        "error": err_msg
                    }
                    return

            # If no tool calls were detected or we ran tools and now got the final content:
            if not detected_tool_calls:
                # If content is still empty after tool execution, perform a direct synthesis turn
                if not final_assistant_content.strip() and tool_execution_cycles > 1:
                    messages.append({
                        "role": "user",
                        "content": "Sintetizza in modo chiaro ed elegante i risultati dei tool e rispondi alla mia richiesta iniziale."
                    })
                    async for synth_chunk in ollama_client.chat_stream(
                        model=model,
                        messages=messages,
                        tools=None,
                        options=options
                    ):
                        if synth_chunk.get("type") == "content":
                            delta = synth_chunk.get("delta", "")
                            final_assistant_content += delta
                            yield {
                                "type": "token",
                                "delta": delta,
                                "content": final_assistant_content
                            }

                # Save assistant message to DB
                asst_msg = Message(
                    id=str(uuid.uuid4()),
                    chat_id=chat_id,
                    role="assistant",
                    content=final_assistant_content.strip() or "Operazione completata con successo."
                )
                db.add(asst_msg)
                await db.commit()
                await db.refresh(asst_msg)

                yield {
                    "type": "done",
                    "message_id": asst_msg.id,
                    "content": asst_msg.content
                }
                return

            # If tool calls were made:
            yield {"type": "status", "status": "executing_tools", "tool_calls_count": len(detected_tool_calls)}

            # Record assistant message with tool calls in history
            messages.append({
                "role": "assistant",
                "content": current_turn_content or "",
                "tool_calls": detected_tool_calls
            })

            # Execute each tool
            for t_call in detected_tool_calls:
                func_obj = t_call.get("function", {})
                t_name = func_obj.get("name", "")
                t_args = func_obj.get("arguments", {})
                if isinstance(t_args, str):
                    try:
                        t_args = json.loads(t_args)
                    except Exception:
                        t_args = {}

                perm_level = get_tool_permission_level(t_name)

                yield {
                    "type": "tool_start",
                    "tool_name": t_name,
                    "permission_level": perm_level.value,
                    "arguments": t_args
                }

                # Check security permissions
                if requires_user_confirmation(perm_level, security_mode):
                    tool_log = ToolCallLog(
                        chat_id=chat_id,
                        tool_name=t_name,
                        permission_level=perm_level.value,
                        arguments=t_args,
                        status="pending"
                    )
                    db.add(tool_log)
                    await db.commit()

                    yield {
                        "type": "approval_required",
                        "tool_name": t_name,
                        "arguments": t_args,
                        "tool_log_id": tool_log.id,
                        "message": f"Il tool '{t_name}' ({perm_level.value}) richiede conferma."
                    }

                # Execute tool
                tool_result = None
                try:
                    tool_ctx = {
                        "chat_id": chat_id,
                        "project_id": context["project"].id if context["project"] else None
                    }
                    if t_name.startswith("mcp_"):
                        tool_result = await mcp_manager.execute_tool(t_name, t_args)
                    else:
                        tool_result = await skill_registry.execute_tool(t_name, t_args, context=tool_ctx)
                    
                    status = "executed"
                except Exception as e:
                    tool_result = {"error": str(e)}
                    status = "failed"

                # Truncate overly large results to prevent context blowout
                str_res = json.dumps(tool_result, ensure_ascii=False) if not isinstance(tool_result, str) else tool_result
                if len(str_res) > 4000:
                    str_res = str_res[:4000] + "... [Troncato per limiti di contesto]"

                # Log tool execution to database
                tool_log = ToolCallLog(
                    chat_id=chat_id,
                    tool_name=t_name,
                    permission_level=perm_level.value,
                    arguments=t_args,
                    result=tool_result,
                    status=status
                )
                db.add(tool_log)
                await db.commit()

                yield {
                    "type": "tool_result",
                    "tool_name": t_name,
                    "result": tool_result,
                    "status": status
                }

                # Add tool response to prompt history
                messages.append({
                    "role": "tool",
                    "content": str_res,
                    "tool_call_id": t_call.get("id") or str(uuid.uuid4())
                })

        # Final Fallback if max cycles reached
        asst_msg = Message(
            id=str(uuid.uuid4()),
            chat_id=chat_id,
            role="assistant",
            content=final_assistant_content.strip() or "Elaborazione dei tool completata."
        )
        db.add(asst_msg)
        await db.commit()

        yield {
            "type": "done",
            "message_id": asst_msg.id,
            "content": asst_msg.content
        }

ai_orchestrator = AIOrchestrator()
