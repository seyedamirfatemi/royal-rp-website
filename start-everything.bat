@echo off
setlocal enabledelayedexpansion
title ROYAL RP - server control

rem ====================================================================
rem  ROYAL RP - start, restart, stop and check the whole stack
rem
rem  Double-click it for a menu, or pass the action directly:
rem
rem      start-everything.bat start      start whatever is down
rem      start-everything.bat restart    website + Caddy  (after a pull)
rem      start-everything.bat restartall everything, game included
rem      start-everything.bat stop       website + Caddy
rem      start-everything.bat status     check, change nothing
rem
rem  Order matters when starting. MySQL first: the website and the game
rem  both refuse to run without it. DNS next, because until it answers
rem  the domain does not exist for anyone. Then the site, then Caddy in
rem  front of it, then the game last - it is the slowest and nothing
rem  else waits on it. Stopping goes the other way round.
rem ====================================================================

openfiles >nul 2>nul
if not %errorlevel%==0 (
    echo.
    echo   This needs Administrator. Relaunching...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -ArgumentList '%*' -Verb RunAs"
    exit /b
)

set "SITE_DIR=%~dp0"
set "GAME_DIR=%~dp0..\..\"
set "CADDY_TASK=Caddy (Royal RP)"
set "DOMAIN=royal-rp.ir"
set "FAILED="

set "ACTION=%~1"
if not "%ACTION%"=="" goto dispatch

:menu
cls
echo.
echo   ================================================
echo    ROYAL RP - server control
echo   ================================================
echo.
echo     1.  Start        - start whatever is down
echo     2.  Restart      - website + Caddy only
echo                        (use after: git pull)
echo     3.  Restart ALL  - everything, game included
echo                        (this disconnects players)
echo     4.  Stop         - website + Caddy
echo     5.  Status       - check only, change nothing
echo     0.  Exit
echo.
set "CHOICE="
set /p "CHOICE=   choose:  "
if "%CHOICE%"=="1" set "ACTION=start"
if "%CHOICE%"=="2" set "ACTION=restart"
if "%CHOICE%"=="3" set "ACTION=restartall"
if "%CHOICE%"=="4" set "ACTION=stop"
if "%CHOICE%"=="5" set "ACTION=status"
if "%CHOICE%"=="0" exit /b
if "%ACTION%"=="" goto menu

:dispatch
echo.
if /i "%ACTION%"=="status"     goto do_status
if /i "%ACTION%"=="stop"       goto do_stop
if /i "%ACTION%"=="start"      goto do_start
if /i "%ACTION%"=="restart"    goto do_restart
if /i "%ACTION%"=="restartall" goto do_restartall
echo   unknown action "%ACTION%"
goto menu

rem ====================================================================
:do_restart
rem  The everyday one: pick up new code without touching the database
rem  or dropping anyone out of the game.
rem ====================================================================
echo   ================================================
echo    restarting the website and Caddy
echo   ================================================
call :stop_caddy
call :stop_site
timeout /t 2 /nobreak >nul
call :start_site
call :start_caddy
goto verify

rem ====================================================================
:do_restartall
rem ====================================================================
echo   ================================================
echo    restarting EVERYTHING
echo   ================================================
echo.
echo   This stops the game server. Players will be disconnected.
set "SURE="
set /p "SURE=   type yes to continue:  "
if /i not "%SURE%"=="yes" (echo   cancelled & goto end)

call :stop_game
call :stop_caddy
call :stop_site
call :stop_dns
call :stop_mysql
timeout /t 3 /nobreak >nul
goto do_start

rem ====================================================================
:do_stop
rem ====================================================================
echo   ================================================
echo    stopping the website and Caddy
echo   ================================================
call :stop_caddy
call :stop_site
echo.
echo   The game server and the databases were left running.
goto end

rem ====================================================================
:do_start
rem ====================================================================
echo   ================================================
echo    bringing everything up
echo   ================================================
call :start_mysql
call :start_dns
call :start_site
call :start_caddy
call :start_game
goto verify

rem ====================================================================
rem  start steps
rem ====================================================================

:start_mysql
echo.
echo   [1/5] MySQL / MariaDB
call :islistening 3306
if %errorlevel%==0 (echo         already running & exit /b)
set "DONE="
for %%S in (mysql MySQL MariaDB mysqld) do (
    if not defined DONE (
        sc query "%%S" >nul 2>nul
        if !errorlevel!==0 (
            echo         starting service %%S
            net start "%%S" >nul 2>nul
            set "DONE=1"
        )
    )
)
if not defined DONE (
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo         no service registered - starting mysqld directly
        start "" /B "C:\xampp\mysql\bin\mysqld.exe" --defaults-file=C:\xampp\mysql\bin\my.ini
    ) else (
        echo         could not find MySQL
        set "FAILED=!FAILED! MySQL"
        exit /b
    )
)
call :waitport 3306 25 "MySQL"
exit /b

:start_dns
echo.
echo   [2/5] DNS Server  ^(the domain itself^)
sc query DNS >nul 2>nul
if not %errorlevel%==0 (
    echo         DNS role not installed - run tools\setup-dns.ps1
    set "FAILED=!FAILED! DNS"
    exit /b
)
call :islistening 53
if %errorlevel%==0 (echo         already running & exit /b)
echo         starting
net start DNS >nul 2>nul
call :waitport 53 15 "DNS"
exit /b

:start_site
echo.
echo   [3/5] website  ^(node, port 4000^)
call :islistening 4000
if %errorlevel%==0 (echo         already running & exit /b)
where pm2 >nul 2>nul
if !errorlevel!==0 (
    echo         starting through pm2
    pushd "%SITE_DIR%"
    call pm2 resurrect >nul 2>nul
    call pm2 start backend/server.js --name royal-site >nul 2>nul
    call pm2 restart royal-site >nul 2>nul
    popd
) else (
    echo         pm2 not installed - starting in a separate window
    start "ROYAL RP website" cmd /c "cd /d "%SITE_DIR%" && node backend\server.js"
)
call :waitport 4000 30 "website"
exit /b

:start_caddy
echo.
echo   [4/5] Caddy  ^(https, ports 80 and 443^)
call :islistening 443
if %errorlevel%==0 (echo         already running & exit /b)
schtasks /query /tn "%CADDY_TASK%" >nul 2>nul
if !errorlevel!==0 (
    echo         starting the scheduled task
    schtasks /run /tn "%CADDY_TASK%" >nul 2>nul
) else (
    if exist "C:\caddy\caddy.exe" (
        echo         no scheduled task - starting in a window
        echo         make it permanent: tools\setup-caddy.ps1 -Domain %DOMAIN% -UseService
        start "Caddy" cmd /c "C:\caddy\caddy.exe run --config C:\caddy\Caddyfile"
    ) else (
        echo         Caddy is not installed - run tools\setup-caddy.ps1
        set "FAILED=!FAILED! Caddy"
        exit /b
    )
)
call :waitport 443 25 "Caddy"
exit /b

:start_game
echo.
echo   [5/5] FiveM server  ^(port 30120^)
tasklist /fi "imagename eq FXServer.exe" 2>nul | findstr /i "FXServer.exe" >nul 2>nul
if %errorlevel%==0 (echo         already running & exit /b)
if exist "%GAME_DIR%!start.bat" (
    echo         starting - it takes a minute or two to load
    start "FiveM server" cmd /c "cd /d "%GAME_DIR%" && !start.bat"
) else (
    echo         could not find !start.bat - start the game yourself
)
exit /b

rem ====================================================================
rem  stop steps
rem ====================================================================

:stop_caddy
echo.
echo   stopping Caddy
schtasks /query /tn "%CADDY_TASK%" >nul 2>nul
if !errorlevel!==0 schtasks /end /tn "%CADDY_TASK%" >nul 2>nul
taskkill /f /im caddy.exe >nul 2>nul
echo         done
exit /b

:stop_site
echo   stopping the website
where pm2 >nul 2>nul
if !errorlevel!==0 (
    call pm2 stop royal-site >nul 2>nul
) else (
    rem kill only the node process holding 4000, not every node on the box
    for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":4000 " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%P >nul 2>nul
    )
)
echo         done
exit /b

:stop_dns
echo   stopping DNS
net stop DNS >nul 2>nul
echo         done
exit /b

:stop_mysql
echo   stopping MySQL
for %%S in (mysql MySQL MariaDB mysqld) do (
    sc query "%%S" >nul 2>nul
    if !errorlevel!==0 net stop "%%S" >nul 2>nul
)
taskkill /f /im mysqld.exe >nul 2>nul
echo         done
exit /b

:stop_game
echo   stopping the FiveM server
taskkill /f /im FXServer.exe >nul 2>nul
echo         done
exit /b

rem ====================================================================
:do_status
:verify
rem ====================================================================
echo.
echo   ================================================
echo    checking
echo   ================================================
set /a _down=0
set "DOWNLIST="
call :check 3306  "MySQL          "
call :check 53    "DNS            "
call :check 4000  "website        "
call :check 443   "Caddy / https  "
call :check 30120 "FiveM          "

echo.
echo   --- from the outside ---
curl.exe -s -o nul -m 15 -w "   https://%DOMAIN%           %%{http_code}\n" "https://%DOMAIN%/"
if errorlevel 1 echo    https://%DOMAIN%           no answer
curl.exe -s -o nul -m 15 -w "   api/health                %%{http_code}\n" "https://%DOMAIN%/api/health"
if errorlevel 1 echo    api/health                no answer

echo.
if !_down! gtr 0 (
    echo   !_down! service^(s^) are not listening:!DOWNLIST!
    if defined FAILED echo   Tried and failed to start:!FAILED!
    echo.
    echo   Run this again and choose Start, or read the step above.
) else (
    echo   All five are listening.
)

echo.
echo   If pages load but sign-in silently fails, Caddy is usually the
echo   reason: a Secure cookie is never sent over plain http, so the
echo   site looks fine while logging in cannot work.

:end
echo.
if "%~1"=="" pause
exit /b

rem ====================================================================
rem  helpers
rem ====================================================================

:islistening
netstat -ano | findstr ":%1 " | findstr "LISTENING" >nul 2>nul
exit /b %errorlevel%

:waitport
set /a _t=%2
:waitloop
call :islistening %1
if %errorlevel%==0 (echo         %~3 is up & exit /b 0)
set /a _t-=1
if %_t% leq 0 (
    echo         %~3 did NOT come up
    set "FAILED=!FAILED! %~3"
    exit /b 1
)
timeout /t 1 /nobreak >nul
goto waitloop

:check
call :islistening %1
if %errorlevel%==0 (
    echo    %~2 port %1   up
) else (
    echo    %~2 port %1   DOWN
    set /a _down+=1
    set "DOWNLIST=!DOWNLIST! %~2"
)
exit /b
