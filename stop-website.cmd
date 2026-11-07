@echo off
wsl.exe -d Ubuntu -u root -- bash /opt/stop-devspace.sh
echo Developer Space container stopped.
pause
