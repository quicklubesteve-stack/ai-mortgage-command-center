@echo off
cd /d "%~dp0"
title Deploy AI Mortgage Command Center to Cloudflare Pages
color 0B

echo =========================================================================
echo    🍁 AI Mortgage Command Center — Cloudflare Deployment Assistant
echo    Tagline: Smarter Mortgage Workflows. Human-Controlled Decisions.
echo =========================================================================
echo.

echo [1/3] Building production assets and preparing Cloudflare bundle...
call npm.cmd run build:cf
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed. Please fix any build errors first.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Checking Cloudflare authentication...
echo Running 'npx wrangler whoami'...
call npx.cmd wrangler whoami
if %ERRORLEVEL% neq 0 (
    echo.
    echo =========================================================================
    echo You are not currently logged in to Cloudflare on this machine.
    echo Running 'npx wrangler login' now to authenticate via your browser...
    echo =========================================================================
    call npx.cmd wrangler login
)

echo.
echo [3/3] Deploying project to Cloudflare Pages...
call npx.cmd wrangler pages deploy cf-dist --project-name=ai-mortgage-command-center

echo.
echo =========================================================================
echo    ✅ Deployment command finished!
echo    Check the Cloudflare URL printed above to view your live website.
echo =========================================================================
pause

