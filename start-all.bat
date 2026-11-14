@echo off
title Siddhivinayak CNC - Full Stack Launcher
color 0B
echo ========================================================
echo   Siddhivinayak CNC Workshop Management System
echo   Starting PHP Backend and React Frontend...
echo ========================================================
echo.

:: Detect PHP
set "PHP_CMD=php"
where php >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" (
        set "PHP_CMD=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
    )
)

:: 1. Launch PHP Backend in a separate window
echo [1/2] Launching PHP Backend (localhost:8000)...
start "Siddhivinayak CNC - PHP Backend" cmd /k "cd /d %~dp0backend && "%PHP_CMD%" -S localhost:8000"

:: 2. Wait 1 second
timeout /t 1 /nobreak >nul

:: 3. Launch React Frontend in a separate window
echo [2/2] Launching React Frontend (Vite)...
start "Siddhivinayak CNC - React Frontend" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

:: 4. Wait 2 seconds and open browser
timeout /t 2 /nobreak >nul
echo Opening application in browser...
start http://localhost:5173

echo.
echo ========================================================
echo   System is now running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   To stop, simply close the respective command windows.
echo ========================================================
echo.
pause
