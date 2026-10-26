@echo off
echo ========================================================
echo Starting VeriCheck AI (SIH 26261)
echo ========================================================

start "AICTE Backend (FastAPI :8000)" cmd /k "cd /d %~dp0backend && python main.py"
timeout /t 2 /nobreak >nul
start "Applicant Portal (React :5173)" cmd /k "cd /d %~dp0applicant-portal && npm run dev"
start "Officer Dashboard (React :5174)" cmd /k "cd /d %~dp0officer-dashboard && npm run dev"

echo.
echo All 3 independent services launched!
echo - Backend API:         http://localhost:8000/docs
echo - Applicant Portal:    http://localhost:5173
echo - Officer Dashboard:   http://localhost:5174
echo.
pause
