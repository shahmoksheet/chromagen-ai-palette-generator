@echo off
echo 🚀 Deploying ChromaGen to GitHub...

REM Check if git is initialized
if not exist ".git" (
    echo 📁 Initializing Git repository...
    git init
)

REM Add all files
echo 📦 Adding files to Git...
git add .

REM Create commit
echo 💾 Creating commit...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=feat: ChromaGen AI Color Palette Generator with Gemini integration
git commit -m "%commit_msg%"

REM Check if remote exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo 🔗 Setting up GitHub remote...
    set /p github_username="Enter your GitHub username: "
    set /p repo_name="Enter repository name (default: chromagen-ai-palette-generator): "
    if "%repo_name%"=="" set repo_name=chromagen-ai-palette-generator
    
    git remote add origin "https://github.com/%github_username%/%repo_name%.git"
    echo ✅ Remote added: https://github.com/%github_username%/%repo_name%.git
    echo.
    echo 📋 Next steps:
    echo 1. Go to GitHub.com and create a new repository named: %repo_name%
    echo 2. Make it public so others can see your awesome work!
    echo 3. Don't initialize with README (we already have one)
    echo 4. Run this script again to push your code
    echo.
    pause
    exit /b 0
)

REM Set main branch and push
echo 🚀 Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo 🎉 Successfully deployed to GitHub!
for /f "tokens=*" %%i in ('git remote get-url origin') do set repo_url=%%i
echo 🌐 Your repository: %repo_url%
echo.
echo 🔧 Next steps:
echo 1. Set up environment variables for deployment
echo 2. Deploy to Vercel/Netlify for live demo
echo 3. Add screenshots to your README
echo 4. Share your awesome AI color palette generator!
echo.
echo ✨ Happy coding!
pause