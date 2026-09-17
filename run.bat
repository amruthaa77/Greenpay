@echo off
echo ====================================================
echo   Starting GreenPay Platform (Backend + Frontend)
echo ====================================================

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000...
start powershell -NoExit -Command "cd '%~dp0'; $env:PYTHONPATH='backend'; .\venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --port 8000"

echo [2/2] Launching Vite React Frontend on http://localhost:5173...
start powershell -NoExit -Command "cd '%~dp0frontend'; npm run dev"

echo.
echo Both servers are starting in separate windows!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ====================================================
pause
