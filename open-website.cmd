@echo off
wsl.exe -d Ubuntu -u root -- bash /opt/start-devspace.sh
if errorlevel 1 (
  echo Failed to start Docker site.
  pause
  exit /b 1
)
start "" "http://localhost:4173"
