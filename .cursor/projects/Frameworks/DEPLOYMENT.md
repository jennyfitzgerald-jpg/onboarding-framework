# Deployment Guide

Your onboarding framework needs to be hosted so people outside your network can access it. Here are the best options:

## Option 1: Railway (Recommended - Easiest)

1. **Sign up** at [railway.app](https://railway.app) (free tier available)

2. **Install Railway CLI** (optional, or use web interface):
   ```bash
   npm i -g @railway/cli
   railway login
   ```

3. **Deploy**:
   ```bash
   railway init
   railway up
   ```

4. **Set environment variables** (if needed):
   - Go to your project settings
   - Add any environment variables

5. **Get your URL**: Railway will give you a URL like `https://your-app.railway.app`

**Database**: Railway automatically handles the SQLite database file. It persists between deployments.

## Option 2: Render (Free Tier Available)

1. **Sign up** at [render.com](https://render.com)

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Or use the Render dashboard to deploy

3. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

4. **Database**: Render provides PostgreSQL, but SQLite will work for small teams. For production, consider upgrading to PostgreSQL.

5. **Get your URL**: Render gives you a URL like `https://your-app.onrender.com`

## Option 3: Vercel (Frontend + Serverless)

1. **Sign up** at [vercel.com](https://vercel.com)

2. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

**Note**: Vercel is serverless, so you'll need to use a separate database service (like Railway's database or Supabase).

## Option 4: Heroku (Paid, but reliable)

1. **Sign up** at [heroku.com](https://heroku.com)

2. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   heroku login
   ```

3. **Create app**:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

4. **Database**: Heroku provides PostgreSQL add-ons (free tier available)

## Option 5: DigitalOcean App Platform

1. **Sign up** at [digitalocean.com](https://digitalocean.com)

2. **Create App**:
   - Connect your GitHub repository
   - Select Node.js
   - Configure build and start commands

3. **Database**: Use DigitalOcean's managed database or SQLite for small teams

## Quick Deploy with Railway (Recommended)

The easiest way:

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo" (or upload the folder)
4. Railway will automatically detect it's a Node.js app
5. It will deploy and give you a URL

**That's it!** Your framework will be accessible to anyone with the URL.

## Environment Variables

If you need to set the port:
- Railway: Automatically sets PORT
- Render: Set PORT=10000 in environment variables
- Heroku: Automatically sets PORT

## Database Persistence

- **Railway**: SQLite file persists automatically
- **Render**: SQLite works, but consider PostgreSQL for production
- **Heroku**: Use PostgreSQL add-on (free tier available)
- **Vercel**: Need external database (Supabase, Railway DB, etc.)

## After Deployment

1. Share the URL with your team
2. They can access it from anywhere
3. All progress and leader assignments are saved in the database
4. Multiple people can use it simultaneously

## Custom Domain (Optional)

Most platforms allow you to add a custom domain:
- Railway: Settings → Domains
- Render: Settings → Custom Domains
- Vercel: Settings → Domains

## Need Help?

- Railway: [docs.railway.app](https://docs.railway.app)
- Render: [render.com/docs](https://render.com/docs)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
