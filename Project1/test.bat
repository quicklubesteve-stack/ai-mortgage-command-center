@echo off
title Mortgage Agent Test Suite - 20 Verification Checks
cls
echo =========================================================================
echo  🧪 RUNNING 20-POINT AUTOMATED TEST SUITE (ZERO DEPENDENCIES)
echo  Verifying Guardrails, Underwriting Math, Product Matrices, and API
echo =========================================================================
echo.

node test\run-tests.js

echo.
echo =========================================================================
echo  Test run completed. Press any key to exit.
echo =========================================================================
pause >nul
