Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting VeriCheck AI (SIH 26261)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; python main.py"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\applicant-portal'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\officer-dashboard'; npm run dev"

Write-Host ""
Write-Host "All 3 services launched:" -ForegroundColor Yellow
Write-Host "1. Backend API:          http://localhost:8000 (OpenAPI: /docs)" -ForegroundColor White
Write-Host "2. Applicant Portal:     http://localhost:5173" -ForegroundColor White
Write-Host "3. Officer Dashboard:    http://localhost:5174" -ForegroundColor White
Write-Host ""
