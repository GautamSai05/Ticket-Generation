# QR Attendance System - Deployment Guide

## 🚀 Netlify Deployment Steps

### 1. Deploy Backend First

Your backend needs to be deployed before the frontend. Options:

**Option A: Railway.app (Easiest)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
cd "d:\club ts\backend-ts"
railway login
railway init
railway up
```

**Option B: Render.com**
1. Push backend to GitHub
2. Go to [Render.com](https://render.com)
3. Create New Web Service
4. Connect GitHub repo
5. Build command: `npm install && npm run build`
6. Start command: `npm start`
7. Add environment variables from `.env`

**Option C: Heroku**
```bash
cd "d:\club ts\backend-ts"
heroku create your-app-name
git push heroku main
```

### 2. Update Frontend Environment Variable

After backend is deployed, copy the backend URL (e.g., `https://your-app.railway.app`)

**Update in Netlify:**
1. Go to Site Settings → Environment Variables
2. Add: `REACT_APP_API_URL` = `https://your-backend-url.com`

**Or update locally before deploying:**
Edit `frontend/.env`:
```
REACT_APP_API_URL=https://your-backend-url.com
```

### 3. Deploy Frontend to Netlify

**Method 1: Drag & Drop (Easiest)**
1. Run: `cd "d:\club ts\frontend" && npm run build:windows`
2. Go to [Netlify](https://app.netlify.com)
3. Drag the `build` folder to Netlify

**Method 2: Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
cd "d:\club ts\frontend"
netlify login
netlify deploy --prod
```

**Method 3: GitHub (Continuous Deployment)**
1. Push code to GitHub
2. Connect Netlify to your repo
3. Set build command: `npm run build:windows`
4. Set publish directory: `build`
5. Add environment variable: `REACT_APP_API_URL`

### 4. Configure CORS in Backend

Update `backend-ts/.env`:
```
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

Or allow all (not recommended for production):
```
CORS_ORIGIN=*
```

### 5. Test Your Deployment

1. Visit your Netlify URL
2. Click "Start Scanner"
3. Allow camera permissions
4. Scan a QR code
5. Check if attendance is recorded

---

## 📋 Pre-Deployment Checklist

- [ ] Backend deployed and running
- [ ] Backend URL added to frontend environment variables
- [ ] CORS configured in backend
- [ ] Firebase credentials uploaded to backend hosting
- [ ] Frontend build successful
- [ ] QR codes generated for testing
- [ ] Test scan works on localhost
- [ ] Deploy frontend to Netlify
- [ ] Test on production URL

---

## 🔧 Troubleshooting

**"Failed to fetch" error:**
- Check backend URL is correct
- Verify backend is running
- Check CORS settings
- Use HTTPS for backend (not HTTP)

**Camera not working:**
- Netlify sites use HTTPS by default ✓
- Some browsers require HTTPS for camera access

**Firebase errors:**
- Upload `serviceAccountKey.json` to backend hosting
- Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Enable Firestore API in Google Cloud Console

---

## 📝 Current Configuration

**Frontend:** Ready to deploy
**Backend:** Needs deployment first
**Database:** Firebase Firestore (already configured)

**Next Steps:**
1. Deploy backend to Railway/Render/Heroku
2. Get backend URL
3. Update `netlify.toml` with backend URL
4. Deploy frontend to Netlify
