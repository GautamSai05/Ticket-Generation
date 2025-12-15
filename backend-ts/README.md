# QR-Based Attendance System

A complete TypeScript + Express backend and browser-based frontend for recording student attendance via QR code scanning.

## 🚀 Features

- **QR Code Scanning**: Camera-based QR scanning using html5-qrcode
- **Flexible QR Format**: Supports both plain student IDs and JSON objects with student details
- **Firestore Integration**: Stores attendance records and student data in Firebase Firestore
- **Duplicate Prevention**: Prevents duplicate attendance for the same student on the same day
- **Rate Limiting**: 20 requests per minute per IP to prevent abuse
- **API Key Authentication**: Optional header-based authentication
- **CORS Support**: Configured for local development
- **TypeScript**: Type-safe code with strict mode enabled

## 📋 Prerequisites

1. **Node.js** (v18+ recommended)
2. **Firebase Project** with Firestore enabled
3. **Service Account Key** from Firebase Console

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `serviceAccountKey.json` in the project root

### 3. Enable Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode** (for development) or **production mode**
4. Select a Cloud Firestore location

### 4. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your settings
```

**.env file:**
```env
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
FIRESTORE_COLLECTION=attendance
FIRESTORE_STUDENTS_COLLECTION=students
PORT=8080
API_KEY=
CORS_ORIGIN=*
```

### 5. Seed Sample Students

```bash
npm run seed
```

This creates 10 sample students in your Firestore database.

### 6. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:8080`

## 📱 Using the Scanner

1. Open `public/scanner.html` in a web browser
2. Click **Start Scanner** and allow camera permissions
3. Scan a QR code containing either:
   - Plain student ID: `STU001`
   - JSON format: `{"id":"STU001","name":"Alice Johnson","class":"10A"}`

The scanner will automatically POST to the backend and display the response.

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:8080/health
```

### Record Attendance (Plain ID)
```bash
curl -X POST http://localhost:8080/attendance/scan \
  -H "Content-Type: application/json" \
  -d '{"qrData":"STU001"}'
```

### Record Attendance (JSON with extra data)
```bash
curl -X POST http://localhost:8080/attendance/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qrData":"STU999",
    "extra": {
      "id": "STU999",
      "name": "John Doe",
      "class": "12A"
    }
  }'
```

### With API Key Authentication
```bash
curl -X POST http://localhost:8080/attendance/scan \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '{"qrData":"STU001"}'
```

### List Recent Attendance
```bash
curl http://localhost:8080/attendance/list?limit=10
```

## 📁 Project Structure

```
backend-ts/
├── src/
│   ├── firebaseConfig.ts      # Firebase Admin initialization
│   ├── server.ts              # Express server with middleware
│   ├── routes/
│   │   └── attendance.ts      # Attendance API routes
│   └── utils/
│       └── generateQR.ts      # QR code generation utilities
├── scripts/
│   └── seedStudents.ts        # Student data seeding script
├── public/
│   └── scanner.html           # QR scanner frontend
├── .env                       # Environment variables (create from .env.example)
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── serviceAccountKey.json     # Firebase credentials (DO NOT COMMIT)
└── README.md                  # This file
```

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/attendance/scan` | Record attendance from QR scan |
| GET | `/attendance/list` | List recent attendance records |

## 🔒 Security Features

- **Rate Limiting**: 20 requests per minute per IP
- **API Key Auth**: Optional header-based authentication (`x-api-key`)
- **Input Validation**: QR data length and type validation
- **Server Timestamps**: Uses Firestore server timestamps for accuracy
- **Duplicate Prevention**: Blocks duplicate attendance on same day
- **CORS Configuration**: Configurable allowed origins

## 📊 Firestore Collections

### `students` Collection
```json
{
  "id": "STU001",
  "name": "Alice Johnson",
  "class": "10A",
  "email": "alice@school.edu",
  "createdAt": "timestamp"
}
```

### `attendance` Collection
```json
{
  "studentId": "STU001",
  "student": { "id": "STU001", "name": "Alice Johnson", "class": "10A" },
  "scannedAt": "timestamp",
  "source": {
    "ip": "127.0.0.1",
    "userAgent": "Mozilla/5.0..."
  },
  "createdAt": "timestamp"
}
```

### `attendance_by_day` Collection
```json
{
  "studentId": "STU001",
  "attendanceId": "abc123",
  "date": "2025-12-12",
  "createdAt": "timestamp"
}
```

## 🛠️ NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run seed` | Seed sample students to Firestore |

## 🐛 Troubleshooting

### "Unknown file extension .ts"
- Make sure `"type": "module"` is in package.json
- Use `.js` extensions in imports (TypeScript requirement for ES modules)

### "Failed to initialize Firebase Admin"
- Check that `serviceAccountKey.json` exists in project root
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path in `.env`
- Ensure service account has Firestore permissions

### "Permission denied" in Firestore
- Go to Firestore Database > Rules
- For development, use:
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
- **Note**: Use proper security rules for production!

### Scanner not working
- Ensure HTTPS or localhost (camera requires secure context)
- Check camera permissions in browser
- Verify backend URL in `scanner.html` matches your server

## 📝 License

ISC

## 👥 Authors

Generated by GitHub Copilot
