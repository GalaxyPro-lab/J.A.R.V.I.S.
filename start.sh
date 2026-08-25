#!/usr/bin/env bash
echo "==================================================="
echo "      AVVIO J.A.R.V.I.S. AI PERSONAL ASSISTANT     "
echo "==================================================="

# Start backend in background
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
