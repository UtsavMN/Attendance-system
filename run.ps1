Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " SCHOLARIS: School Attendance & Student Management System" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Applying backend migrations & checking database..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\backend"
python manage.py migrate --noinput
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python manage.py runserver 127.0.0.1:8000"
Set-Location -Path "$PSScriptRoot"

Write-Host "[2/3] Launching frontend Vite development server..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev -- --host 127.0.0.1 --port 5173"
Set-Location -Path "$PSScriptRoot"

Write-Host "[3/3] Opening Scholaris in default browser..." -ForegroundColor Green
Start-Sleep -Seconds 3
Start-Process "http://127.0.0.1:5173"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host " Scholaris is actively running!" -ForegroundColor Green
Write-Host " Frontend: http://127.0.0.1:5173" -ForegroundColor White
Write-Host " Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host " Admin Credentials: admin / admin123" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Green
