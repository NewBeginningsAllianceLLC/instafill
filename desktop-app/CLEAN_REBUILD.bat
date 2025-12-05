@echo off
echo Cleaning and rebuilding PDF Auto Filler...
echo.

echo Step 1: Stopping any running processes...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Cleaning build directories...
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron
if exist node_modules\.vite rmdir /s /q node_modules\.vite

echo Step 3: Pulling latest code...
git fetch origin
git reset --hard origin/master

echo Step 4: Installing dependencies...
call npm install

echo Step 5: Building Electron...
call npm run build:electron

echo.
echo ========================================
echo Clean rebuild complete!
echo Now run: npm run dev
echo ========================================
pause
