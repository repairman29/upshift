@echo off
setlocal

REM Run Jarvis repo indexer from repo root; notify Discord when job starts and finishes
set SCRIPT_DIR=%~dp0
pushd "%SCRIPT_DIR%\.."

node "scripts\notify-job.js" "Repo index" started
node "scripts\index-repos.js"
if errorlevel 1 (
  node "scripts\notify-job.js" "Repo index" failed "exit code non-zero"
) else (
  node "scripts\notify-job.js" "Repo index" finished
)

popd
endlocal
