@echo off
echo ====================================
echo TessFrozenFood ERP System - Setup
echo Academic Prototype Installation
echo ====================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please download and install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

:: Check Node.js version
for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [INFO] Found Node.js version: %NODE_VERSION%

:: Install dependencies
echo.
echo [INFO] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ====================================
echo Setup completed successfully!
echo ====================================
echo.
echo To start the development server, run:
echo    npm run dev
echo.
echo Then open http://localhost:3000 in your browser
echo.
pause
