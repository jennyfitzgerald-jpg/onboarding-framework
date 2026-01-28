# Quick Deployment Guide

## 🚀 Deploy to Railway (Easiest - 5 minutes)

1. **Go to** [railway.app](https://railway.app) and sign up (free)

2. **Click "New Project"** → **"Deploy from GitHub repo"**
   - If you haven't pushed to GitHub yet:
     - Create a new repo on GitHub
     - Push your code:
       ```bash
       git init
       git add .
       git commit -m "Initial commit"
       git remote add origin YOUR_GITHUB_REPO_URL
       git push -u origin main
       ```

3. **Railway will automatically**:
   - Detect it's a Node.js app
   - Install dependencies
   - Start the server
   - Give you a URL like `https://your-app.railway.app`

4. **That's it!** Share the URL with your team.

## 📝 What's New

✅ **Quick Leader Assignment**: Click "Assign" button on any step to quickly assign a leader
✅ **Cloud Hosted**: Accessible from anywhere
✅ **Progress Tracking**: Real-time progress bar and statistics
✅ **Shareable**: Share the URL with your entire team

## 🔧 Features

- **Assign Leaders**: Click the "Assign" button next to any step's leader field
- **Edit Steps**: Click "Edit" to modify step details
- **Mark Complete**: Click anywhere on a step card to toggle completion
- **Track Progress**: See overall progress percentage at the top
- **Share**: Click "Share Progress" to get the URL and statistics

## 🌐 Other Hosting Options

See `DEPLOYMENT.md` for:
- Render (free tier)
- Vercel
- Heroku
- DigitalOcean

## 💾 Database

The SQLite database persists automatically on Railway. All your steps, leaders, and progress are saved.

## 🔒 Security Note

Currently, anyone with the URL can edit. For production, consider adding:
- Authentication (login)
- Read-only view for some users
- Role-based permissions
