@echo off
title Canadian AI Mortgage Assistant
echo =========================================================================
echo  🍁 Launching Canadian AI Mortgage Assistant & Underwriting Cockpit
echo =========================================================================
echo.
echo [1] Launching Native Windows 11 Desktop Application...
start "" "%~dp0Project1\dist\win-unpacked\AI Mortgage Assistant.exe"
echo.
echo [2] Opening Web Browser Cockpit at http://localhost:3000 ...
start http://localhost:3000
echo.
echo Application launched! You can close this terminal.
timeout /t 3 >nul
exit
