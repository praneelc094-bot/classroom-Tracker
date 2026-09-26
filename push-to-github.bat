@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo   Push "classroom tracker" to GitHub
echo ==============================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed. Install it from https://git-scm.com and run this again.
  pause & exit /b 1
)

rem --- make sure commits have your name on them (asked only once) ---
for /f "delims=" %%i in ('git config user.name') do set GNAME=%%i
if "%GNAME%"=="" (
  set /p GNAME=Praneel Chauhan: 
  set /p GEMAIL=praneelc094@gmail.com: 
  call git config --global user.name "%%Praneel Chauhan%%"
  call git config --global user.email "%%GEMAIL%%"
)

if not exist ".git" git init

echo.
echo First create an EMPTY private repo at https://github.com/new
echo (name it classroom-tracker, do NOT add a README).
echo.
set /p REPO_URL=Paste the repo URL here (https://github.com/praneelc094-bot/classroom-Tracker): 
if "%REPO_URL%"=="" (
  echo No URL entered. Nothing done.
  pause & exit /b 1
)

git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

rem --- stage everything, but never the API key files ---
git add -A
git rm --cached -q --ignore-unmatch config.js key.md >nul 2>nul
git diff --cached --name-only | findstr /i /x "config.js key.md" >nul
if not errorlevel 1 (
  echo STOP: an API key file is about to be uploaded. Nothing was pushed.
  pause & exit /b 1
)

git commit -m "Phase 1: live transcription, topic detection, evaluation log"
git branch -M main
git pull origin main --allow-unrelated-histories --no-edit >nul 2>nul
git push -u origin main

echo.
if errorlevel 1 (
  echo Push FAILED - read the message above, or send a screenshot to Claude.
) else (
  echo Done! Your code is on GitHub: %REPO_URL%
  echo Your API key files were NOT uploaded.
)
pause
