@echo off
cd /d "%~dp0"
echo ========================================
echo   Developer Space
echo   http://localhost:4173
echo.
echo   Keep this window open while using the site.
echo   Close this window to stop the server.
echo ========================================
echo.
node server.js
echo.
echo The server has stopped.
pause
