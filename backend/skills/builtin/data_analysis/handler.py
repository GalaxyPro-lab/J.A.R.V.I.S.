import math
from typing import Dict, Any, List, Union

ALLOWED_NAMES = {
    k: v for k, v in math.__dict__.items() if not k.startswith("__")
}
ALLOWED_NAMES.update({
    "abs": abs,
    "round": round,
    "min": min,
    "max": max,
    "sum": sum,
    "len": len,
    "pow": pow
})

async def calculate_expression(expression: str) -> Dict[str, Any]:
    try:
        # Evaluate safe math expression
        code = compile(expression, "<string>", "eval")
        for name in code.co_names:
            if name not in ALLOWED_NAMES:
                return {"error": f"Use of '{name}' is not permitted in math expressions."}
        
        result = eval(code, {"__builtins__": {}}, ALLOWED_NAMES)
        return {"expression": expression, "result": result}
    except Exception as e:
        return {"expression": expression, "error": str(e)}

async def analyze_dataset(data: Union[List[Dict[str, Any]], Dict[str, Any]], query: str = "") -> Dict[str, Any]:
    try:
        if isinstance(data, dict):
            return {
                "type": "dictionary",
                "keys": list(data.keys()),
                "total_keys": len(data)
            }
        elif isinstance(data, list):
            count = len(data)
            sample_keys = list(data[0].keys()) if count > 0 and isinstance(data[0], dict) else []
            return {
                "type": "list",
                "count": count,
                "schema_keys": sample_keys,
                "summary": f"Dataset contains {count} items with keys: {', '.join(sample_keys)}"
            }
        return {"error": "Invalid data format for analysis."}
    except Exception as e:
        return {"error": str(e)}

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate_expression",
            "description": "Evaluates complex mathematical expressions, calculations, and formulas safely.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Mathematical formula to evaluate (e.g. 'sqrt(144) + 15 * 3.5')"}
                },
                "required": ["expression"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_dataset",
            "description": "Analyzes JSON dataset structures, counts, schemas, and values.",
            "parameters": {
                "type": "object",
                "properties": {
                    "data": {"description": "Structured JSON array or object to analyze"},
                    "query": {"type": "string", "description": "Optional specific metric or question"}
                },
                "required": ["data"]
            }
        }
    }
]

HANDLERS = {
    "calculate_expression": calculate_expression,
    "analyze_dataset": analyze_dataset
}
