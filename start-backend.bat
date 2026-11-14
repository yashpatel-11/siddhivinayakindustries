@echo off
title Siddhivinayak CNC Backend (PHP)
echo ==============================================
echo Starting Siddhivinayak CNC PHP Backend...
echo ==============================================

:: Find PHP executable
set "PHP_CMD=php"
where php >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" (
        set "PHP_CMD=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
    )
)

cd /d "%~dp0backend"
echo Serving API from: %cd%
echo Using PHP: %PHP_CMD%
echo.
"%PHP_CMD%" -S localhost:8000
pause
