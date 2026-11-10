@echo off
title Mortgage Agent Chatbot & Steve's Cockpit
cls
echo =========================================================================
echo  🏡 MORTGAGE DEAL FILTRATION CHATBOT - CLASS PROJECT
echo  🔒 System Governance: AI Agent strictly prohibited from loan approvals
echo  👤 Sole Final Credit Authority: Steve (Authorized Human Underwriter)
echo =========================================================================
echo.
echo Launching local server and opening browser at http://localhost:3000 ...
echo.

:: Open default web browser after a brief delay
start "" http://localhost:3000

:: Start the Node HTTP server
node server.js

pause
