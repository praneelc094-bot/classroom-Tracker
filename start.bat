@echo off
cd /d "%~dp0"
echo Starting local server at http://localhost:3000 ...
start "" http://localhost:3000
npx --yes serve -l 3000 .
