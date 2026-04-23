# TRD - Trading & Risk Dashboard - Startup Script (PowerShell)
# This script starts both backend and frontend

Write-Host ""
Write-Host "============================================================"
Write-Host "          TRD - Trading & Risk Dashboard"
Write-Host "          Startup Script"
Write-Host "============================================================"
Write-Host ""

# Check if we're in the right directory
if (!(Test-Path "pom.xml")) {
    Write-Host "Error: pom.xml not found. Please run this script from D:\TRD directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (!(Test-Path "frontend\package.json")) {
    Write-Host "Error: frontend\package.json not found. Project structure seems incorrect." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check for MySQL
$mysqlRunning = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue
if (!$mysqlRunning) {
    Write-Host "Warning: MySQL doesn't appear to be running on port 3306" -ForegroundColor Yellow
    Write-Host "Please ensure MySQL is running before continuing."
    Write-Host ""
}

Write-Host "Starting Backend (Spring Boot 3.x on port 8083)..." -ForegroundColor Green
Write-Host ""

# Build the project first (optional - comment out to skip)
Write-Host "Building backend..." -ForegroundColor Cyan
.\mvnw.cmd clean package -DskipTests -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    Read-Host "Press Enter to continue anyway"
}

# Start backend in a new window
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\mvnw.cmd spring-boot:run" -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host "Starting Frontend (Vite on port 3000)..." -ForegroundColor Green
Write-Host ""

# Start frontend in a new window
Push-Location frontend
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal
Pop-Location

Write-Host ""
Write-Host "============================================================"
Write-Host "Backend started in separate window (port 8083)" -ForegroundColor Green
Write-Host "Frontend started in separate window (port 3000)" -ForegroundColor Green
Write-Host ""
Write-Host "Application will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API will be available at: http://localhost:8083" -ForegroundColor Cyan
Write-Host ""
Write-Host "Close either window to stop that service."
Write-Host "============================================================"
Write-Host ""

