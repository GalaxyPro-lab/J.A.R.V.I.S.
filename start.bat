@echo off
echo ===================================================
echo       AVVIO J.A.R.V.I.S. AI PERSONAL ASSISTANT
echo ===================================================
echo.

echo [1/2] Avvio Backend FastAPI (Porta 8000)...
start "JARVIS Backend" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Avvio Frontend Vite (Porta 3000)...
cd frontend
start "JARVIS Frontend" cmd /k "npm run dev"

echo.
echo JARVIS e pronto!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo Documentazione API: http://localhost:8000/docs
echo.
pause
