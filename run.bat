@echo off
title Verdiqo - Bail Management System Server
echo ========================================================
echo   VERDIQO: SMART BAIL VERIFICATION PLATFORM
echo   Quantex Intelligence Systems (P) Ltd.
echo   Starting secure local web server...
echo ========================================================
echo.

echo Launching default web browser at http://localhost:8000/...
start "" "http://localhost:8000/"

:: Starts the lightweight file-based Node.js API & static server
node server.js

pause
