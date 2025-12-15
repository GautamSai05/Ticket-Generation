# 🚀 Quick Start Checklist

Follow these steps to get your QR-based attendance system up and running:

## ✅ Setup Checklist

### 1. ✓ Install Dependencies
```bash
npm install
```
**Status**: Already done! ✓

### 2. 📋 Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ > **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded JSON file as `serviceAccountKey.json` in the project root

**Current status**: Check if file exists
```bash
# On Windows
dir serviceAccountKey.json

# Expected output: You should see the file listed
```

### 3. 🔥 Enable Firestore Database

1. In Firebase Console, click **Firestore Database** in the left menu
2. Click **Create Database**
3. Choose a location (e.g., us-central1)
4. Select **Start in test mode** (for development)
   - Production mode requires security rules
5. Click **Enable**

**Verification**: You should see an empty Firestore database interface

### 4. ⚙️ Configure Environment Variables

Your `.env` file is already created. Review and update if needed:

```bash
# View current .env
type .env

# Default values:
# GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
# FIRESTORE_COLLECTION=attendance
# FIRESTORE_STUDENTS_COLLECTION=students
# PORT=8080
# API_KEY=                    # Leave empty to disable auth
# CORS_ORIGIN=*
```

**Optional**: Set an API key for authentication:
```env
API_KEY=your-secret-key-here
```

### 5. 📊 Seed Sample Students

```bash
npm run seed
```

**Expected output**:
```
✓ Successfully seeded 10 students

📱 Sample QR code formats:
   Plain ID:  STU001
   JSON:      {"id":"STU001","name":"Alice Johnson","class":"10A"}
```

### 6. 🖼️ Generate QR Codes (Optional)

```bash
npm run generate-qr
```

This creates printable QR codes in the `qr-codes/` directory:
- `STU001_simple.png` - Contains only student ID
- `STU001_full.png` - Contains JSON with name and class

### 7. 🚀 Start Development Server

```bash
npm run dev
```

**Expected output**:
```
✓ Firebase Admin initialized successfully
🚀 Server running on port 8080
   Health check: http://localhost:8080/health
   Attendance API: http://localhost:8080/attendance/scan
   API Key authentication: DISABLED (set API_KEY in .env to enable)
```

### 8. 🧪 Test the API

Open a new terminal and test:

```bash
# Health check
curl http://localhost:8080/health

# Record attendance
curl -X POST http://localhost:8080/attendance/scan \
  -H "Content-Type: application/json" \
  -d "{\"qrData\":\"STU001\"}"

# Expected response:
# {"id":"...","message":"Attendance recorded successfully","studentId":"STU001","student":{...}}
```

### 9. 📱 Test the Scanner

1. Open `public/scanner.html` in your browser:
   ```
   file:///d:/club%20ts/backend-ts/public/scanner.html
   ```
   
   Or use a local server:
   ```bash
   # Install a simple HTTP server
   npm install -g http-server
   
   # Serve the public folder
   cd public
   http-server -p 3000
   
   # Open: http://localhost:3000/scanner.html
   ```

2. Click "Start Scanner"
3. Allow camera permissions
4. Scan a QR code (use generated QR codes or create one online)

### 10. 🎉 You're Done!

Your attendance system is now running!

---

## 🔧 Troubleshooting

### "Failed to initialize Firebase Admin"
- ✓ Check `serviceAccountKey.json` exists in project root
- ✓ Verify the JSON file is valid (open in a text editor)
- ✓ Ensure Firestore is enabled in Firebase Console

### "Permission denied" errors in Firestore
- Go to Firestore > Rules
- For development, use open rules:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
  ```
- ⚠️ Use proper security rules in production!

### Scanner not working
- ✓ Use HTTPS or localhost (camera requires secure context)
- ✓ Check camera permissions in browser
- ✓ Verify backend URL in scanner.html matches your server

### "Unknown file extension .ts" error
- Already fixed! ✓
- `"type": "module"` is set in package.json
- Using `.js` extensions in imports

---

## 📚 Next Steps

1. **Customize student data**: Edit `scripts/seedStudents.ts`
2. **Add security**: Set `API_KEY` in `.env`
3. **Deploy**: Build with `npm run build` and deploy to your server
4. **Print QR codes**: Use generated QR codes from `qr-codes/` directory
5. **Monitor attendance**: Query Firestore or build a dashboard

---

## 🎯 Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run seed` | Seed sample students |
| `npm run generate-qr` | Generate QR codes for all students |
| `npm run build` | Build for production |
| `npm start` | Run production build |

---

**Need help?** Check [README.md](README.md) for detailed documentation.
