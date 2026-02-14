@echo off
REM Double-click this file (Windows) to start the F1 telemetry relay.
REM Keep this window open while using the dashboard.

cd /d "%~dp0"
echo Starting F1 Telemetry Relay...
echo Leave this window open. Close it to stop the relay.
echo.
node scripts/telemetry-relay.js
echo.
echo Relay stopped. Press any key to close.
pause >nul
