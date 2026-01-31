@echo off
setlocal

REM Run JARVIS Autonomous Build from repo root
set SCRIPT_DIR=%~dp0
pushd "%SCRIPT_DIR%\.."

node "scripts\jarvis-autonomous-build.js" %*

popd
endlocal
