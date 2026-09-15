#!/usr/bin/env bash

# Simple deployment script mirroring deploy.bat for Linux/macOS
# It adds all changes, commits with a timestamped message, and pushes to the remote repository.

set -e

echo "Starting deployment process..."

# Get current date and time for the commit message
current_date=$(date +"%Y-%m-%d")
current_time=$(date +"%H:%M:%S")
commit_message="Auto deploy at $current_date $current_time"

# Step 1: Add changes
echo "Step 1: Adding changes to git..."
git add .

# Step 2: Commit changes (ignore if nothing to commit)
echo "Step 2: Committing with message: \"$commit_message\"..."
if git diff-index --quiet HEAD --; then
  echo "No changes to commit."
else
  git commit -m "$commit_message"
fi

# Step 3: Push to remote
echo "Step 3: Pushing to remote repository..."
git push

echo "================================================================"
echo "Done! If your GitHub repo is linked to Vercel, it will auto‑deploy."
echo "================================================================"
