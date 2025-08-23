#!/bin/bash

# GitHub Repository Setup Script for DirReactFinal
# This script helps set up the GitHub repository and configure remotes

echo "🚀 Setting up GitHub repository for DirReactFinal..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run 'git init' first."
    exit 1
fi

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check if remote already exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "⚠️  Remote 'origin' already exists:"
    git remote get-url origin
    echo ""
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Updating remote..."
    else
        echo "✅ Keeping existing remote. Setup complete!"
        exit 0
    fi
fi

echo ""
echo "📋 Manual GitHub Repository Setup Instructions:"
echo "=============================================="
echo ""
echo "1. Go to https://github.com/new"
echo "2. Repository name: DirReactFinal"
echo "3. Description: Directory Management System with Django + React"
echo "4. Make it Private (recommended for proprietary software)"
echo "5. Don't initialize with README (we already have one)"
echo "6. Click 'Create repository'"
echo ""
echo "After creating the repository, GitHub will show you the repository URL."
echo "It will look like: https://github.com/YOUR_USERNAME/DirReactFinal.git"
echo ""

# Get GitHub username and repository name
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter the repository name (default: DirReactFinal): " REPO_NAME
REPO_NAME=${REPO_NAME:-DirReactFinal}

# Construct the remote URL
REMOTE_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo ""
echo "🔗 Remote URL: $REMOTE_URL"

# Add remote origin
echo "➕ Adding remote origin..."
git remote add origin "$REMOTE_URL"

# Verify remote was added
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ Remote 'origin' added successfully!"
    echo ""
    echo "📤 Pushing to GitHub..."
    
    # Push the initial commit
    if git push -u origin "$CURRENT_BRANCH"; then
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "🎉 Repository setup complete!"
        echo "🌐 View your repository at: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
        echo ""
        echo "📝 Next steps:"
        echo "  - Set up branch protection rules"
        echo "  - Configure GitHub Actions (if needed)"
        echo "  - Add collaborators (if needed)"
        echo "  - Set up deployment keys for production"
    else
        echo "❌ Failed to push to GitHub. Please check your credentials and try again."
        echo "💡 You may need to authenticate with GitHub first."
        echo "   Run: git config --global user.name 'Your Name'"
        echo "   Run: git config --global user.email 'your.email@example.com'"
    fi
else
    echo "❌ Failed to add remote. Please check the URL and try again."
    exit 1
fi

echo ""
echo "🔐 Authentication Note:"
echo "If you haven't set up authentication, you may be prompted for your GitHub username and password/token."
echo "For security, use a Personal Access Token instead of your password:"
echo "  - Go to GitHub Settings > Developer settings > Personal access tokens"
echo "  - Generate a new token with 'repo' permissions"
echo "  - Use this token as your password when prompted"
