# GreenPay Startup Script for Windows PowerShell
Write-Host "====================================================" -ForegroundColor Green
Write-Host "  Starting GreenPay Platform (Backend + Frontend)   " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

# 1. Launch Backend Server in a dedicated PowerShell window
Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:PYTHONPATH='backend'; .\venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --port 8000"

# 2. Launch Frontend Dev Server in a dedicated PowerShell window
Write-Host "[2/2] Launching Vite Frontend on http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host "Frontend App: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Swagger Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green
