@echo off
echo 🌿 AudioLeaf Deployment Script
echo ==============================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Run linting
echo 🔍 Running linting...
call npm run lint

if %errorlevel% neq 0 (
    echo ⚠️  Linting issues found, but continuing with deployment...
)

REM Build the project
echo 🏗️  Building the project...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Build completed successfully!

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Vercel CLI...
    call npm install -g vercel
)

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
call vercel --prod

if %errorlevel% equ 0 (
    echo ✅ Deployment completed successfully!
    echo 🌐 Your AudioLeaf app is now live!
) else (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

pause 