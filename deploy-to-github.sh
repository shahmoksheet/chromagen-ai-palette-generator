#!/bin/bash

# ChromaGen GitHub Deployment Script
echo "🚀 Deploying ChromaGen to GitHub..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Add all files
echo "📦 Adding files to Git..."
git add .

# Create commit
echo "💾 Creating commit..."
read -p "Enter commit message (or press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="feat: ChromaGen AI Color Palette Generator with Gemini integration"
fi
git commit -m "$commit_msg"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Setting up GitHub remote..."
    read -p "Enter your GitHub username: " github_username
    read -p "Enter repository name (default: chromagen-ai-palette-generator): " repo_name
    if [ -z "$repo_name" ]; then
        repo_name="chromagen-ai-palette-generator"
    fi
    
    git remote add origin "https://github.com/$github_username/$repo_name.git"
    echo "✅ Remote added: https://github.com/$github_username/$repo_name.git"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to GitHub.com and create a new repository named: $repo_name"
    echo "2. Make it public so others can see your awesome work!"
    echo "3. Don't initialize with README (we already have one)"
    echo "4. Run this script again to push your code"
    echo ""
    exit 0
fi

# Set main branch and push
echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "🎉 Successfully deployed to GitHub!"
echo "🌐 Your repository: $(git remote get-url origin)"
echo ""
echo "🔧 Next steps:"
echo "1. Set up environment variables for deployment"
echo "2. Deploy to Vercel/Netlify for live demo"
echo "3. Add screenshots to your README"
echo "4. Share your awesome AI color palette generator!"
echo ""
echo "✨ Happy coding!"