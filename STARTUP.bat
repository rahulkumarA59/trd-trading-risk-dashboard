@echo off
REM TRD - Trading & Risk Dashboard - Startup Script
REM This script starts both backend and frontend in separate windows

color 0A
echo.
echo ============================================================
echo          TRD - Trading & Risk Dashboard
echo          Startup Script
echo ============================================================
echo.

REM Check if we're in the right directory
if not exist "pom.xml" (
    echo Error: pom.xml not found. Please run this script from D:\TRD directory
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo Error: frontend\package.json not found. Project structure seems incorrect.
    pause
    exit /b 1
)

echo Checking for MySQL...
netstat -an | findstr ":3306" >nul
if errorlevel 1 (
    echo Warning: MySQL doesn't appear to be running on port 3306
    echo Please ensure MySQL is running before continuing.
    echo.
)

echo.
echo Starting Backend (Spring Boot 3.x on port 8083)...
echo.
start "TRD Backend" cmd /k "title TRD Backend && .\mvnw.cmd spring-boot:run"

timeout /t 5 /nobreak

echo.
echo Starting Frontend (Vite on port 3000)...
echo.
cd frontend
start "TRD Frontend" cmd /k "title TRD Frontend && npm run dev"
cd ..

echo.
echo ============================================================
echo Backend started in separate window (port 8083)
echo Frontend started in separate window (port 3000)
echo.
echo Application will be available at: http://localhost:3000
echo API will be available at: http://localhost:8083
echo.
echo Close either window to stop that service.
echo ============================================================
echo.

pause

