@echo off
title Scholaris - School Attendance & Student Management System
echo =====================================================================
echo  SCHOLARIS: School Attendance & Student Management System
echo =====================================================================
echo.

echo [1/3] Preparing Python Django Backend...
cd backend
python manage.py migrate --noinput
start "Scholaris Backend Server (Port 8000)" cmd /k "python manage.py runserver 127.0.0.1:8000"
cd ..

echo.
echo [2/3] Preparing React TypeScript Frontend...
cd frontend
start "Scholaris Frontend Server (Port 5173)" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173"
cd ..

echo.
echo [3/3] Opening Scholaris in Default Browser...
timeout /t 3 /nobreak > nul
start http://127.0.0.1:5173

echo.
echo =====================================================================
echo  Scholaris is running!
echo  Frontend: http://127.0.0.1:5173
echo  Backend:  http://127.0.0.1:8000
echo.
echo  Demo Accounts:
echo    - Super Admin:  admin / admin123
echo    - Principal:    principal / admin123
echo    - Teacher:      teacher.smith / teacher123
echo =====================================================================
pause
