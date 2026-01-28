# Railway Deployment Instructions

## Current Status
- Project Created: romantic-growth
- Project URL: https://railway.com/project/d778dae8-fba4-4df0-a4b1-201543ef5711
- Domain Created: https://romantic-growth-production-9f2e.up.railway.app

## Issue
The service needs to be properly configured. Follow these steps:

## Option 1: Via Railway Dashboard (Easiest)

1. **Go to**: https://railway.com/project/d778dae8-fba4-4df0-a4b1-201543ef5711

2. **Click "New"** → **"Empty Service"** or **"GitHub Repo"**

3. **If using GitHub**:
   - Connect your GitHub account
   - Select this repository
   - Railway will auto-detect Node.js

4. **If using Empty Service**:
   - Click on the service
   - Go to Settings → Source
   - Connect to GitHub repo or upload files

5. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `/` (or leave default)

6. **Generate Domain**:
   - Go to Settings → Networking
   - Click "Generate Domain"
   - This will give you a public URL

7. **Deploy**:
   - Railway will automatically deploy
   - Check the Deployments tab for status

## Option 2: Via CLI (If you prefer)

```bash
# Link to the project
railway link

# Add a new service
railway service

# Deploy
railway up
```

## After Deployment

1. **Seed the database** (if needed):
   - Go to the service in Railway dashboard
   - Open the shell/terminal
   - Run: `npm run seed`

2. **Verify**:
   - Visit the generated domain
   - You should see the onboarding framework

## Troubleshooting

If the URL still doesn't work:
1. Check the Deployments tab in Railway dashboard
2. Check the Logs tab for any errors
3. Ensure the service is set to "Public" in Networking settings
4. Verify the start command is `npm start`
