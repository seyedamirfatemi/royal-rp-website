@echo off
rem ====================================================================
rem  ROYAL RP - start the website
rem
rem  Runs next to the FiveM server on the same machine. Keep this window
rem  open, or install it as a service so it survives a reboot:
rem
rem      npm i -g pm2 pm2-windows-startup
rem      pm2 start backend/server.js --name royal-site
rem      pm2 save
rem      pm2-startup install
rem
rem  If the site will not start, read the lines it prints: it refuses to
rem  run rather than come up half-configured, and it says which value is
rem  missing.
rem ====================================================================
setlocal
cd /d "%~dp0"

if not exist "backend\.env" (
    echo.
    echo   backend\.env is missing.
    echo   Copy the template and fill it in:
    echo.
    echo       copy backend\.env.example backend\.env
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo.
    echo   Installing dependencies, this happens once...
    echo.
    call npm ci --omit=dev
    if errorlevel 1 (
        echo.
        echo   npm ci failed. Trying npm install...
        call npm install --omit=dev
        if errorlevel 1 (
            echo   Install failed. Fix the errors above and run this again.
            pause
            exit /b 1
        )
    )
)

echo.
echo   Starting ROYAL RP website...
echo.
node backend/server.js

rem Only reached if the server exits.
echo.
echo   The website stopped. The reason is above.
pause
