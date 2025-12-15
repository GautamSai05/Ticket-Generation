# 🔄 System Architecture & Flow

## 📊 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    QR ATTENDANCE SYSTEM                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │◄───────►│   Backend    │◄───────►│  Firestore   │
│   Scanner    │  HTTPS  │   Express    │   SDK   │   Database   │
└──────────────┘         └──────────────┘         └──────────────┘
     📱                        🖥️                       ☁️
  html5-qrcode            TypeScript              Firebase Cloud
```

---

## 🔄 Attendance Flow

### 1️⃣ Student Registration Flow

```
┌─────────────┐
│   Admin     │
│  Interface  │
└──────┬──────┘
       │
       │ 1. Run: npm run seed
       ▼
┌─────────────┐
│   Seed      │
│   Script    │
└──────┬──────┘
       │
       │ 2. Create students
       ▼
┌─────────────┐
│  Firestore  │
│  students   │
│ collection  │
└──────┬──────┘
       │
       │ 3. Run: npm run generate-qr
       ▼
┌─────────────┐
│ QR Codes    │
│  Generated  │
│  (PNG files)│
└─────────────┘
```

### 2️⃣ QR Code Scanning Flow

```
┌─────────────┐
│   Student   │
│ Shows QR    │
└──────┬──────┘
       │
       │ 1. QR code contains:
       │    "STU001" or
       │    {"id":"STU001","name":"Alice",...}
       ▼
┌─────────────┐
│   Scanner   │
│   (Camera)  │
└──────┬──────┘
       │
       │ 2. html5-qrcode decodes
       ▼
┌─────────────┐
│  Scanner    │
│   Page JS   │
└──────┬──────┘
       │
       │ 3. POST /attendance/scan
       │    Body: { qrData: "..." }
       ▼
┌─────────────┐
│   Express   │
│   Backend   │
└──────┬──────┘
       │
       │ 4. Process request
       ├──► Rate Limiter (20/min)
       ├──► API Key Check (optional)
       ├──► Validate qrData
       │
       │ 5. Resolve student
       ├──► Try: Parse JSON
       ├──► Try: Lookup Firestore
       └──► Fallback: Use plain ID
       ▼
┌─────────────┐
│  Check for  │
│  Duplicate  │
│  Today?     │
└──────┬──────┘
       │
       ├─ YES ──► Return 400 Error
       │           "Already recorded"
       │
       └─ NO ───► Continue
       ▼
┌─────────────┐
│   Save to   │
│  Firestore  │
├─────────────┤
│ attendance  │
│ collection  │
└──────┬──────┘
       │
       │ Also save to:
       ▼
┌─────────────┐
│attendance_  │
│  by_day     │
│ (prevents   │
│ duplicates) │
└──────┬──────┘
       │
       │ 6. Return 201 Success
       ▼
┌─────────────┐
│   Scanner   │
│  Shows ✓    │
│  Success    │
└─────────────┘
```

---

## 📂 Data Flow Diagram

### Student Data Resolution

```
QR Code Scanned
      ↓
┌─────────────────────────────────────┐
│  What data is in the QR code?       │
└─────────────────────────────────────┘
      ↓
      ├─────────────┬─────────────────┐
      ↓             ↓                 ↓
  Plain ID      JSON with ID    JSON without ID
  "STU001"      {"id":"STU001"} {"name":"Alice"}
      ↓             ↓                 ↓
      │             │                 │
      │         Use JSON data     Invalid
      │         directly          (400 error)
      │             ↓
      │         Student found
      │             ↓
      ├─────────────┘
      ↓
  Lookup in Firestore
  students/STU001
      ↓
      ├─────────────┬──────────────┐
      ↓             ↓              ↓
  Found         Not Found     Error
  Use data      Create empty  (500)
  from DB       student obj
      ↓             ↓
      └─────────────┤
                    ↓
            Student Resolved
                    ↓
            Check Duplicate
                    ↓
            Save Attendance
```

---

## 🗄️ Firestore Data Model

```
Firestore
│
├── 📁 students/
│   ├── 📄 STU001
│   │   ├── id: "STU001"
│   │   ├── name: "Alice Johnson"
│   │   ├── class: "10A"
│   │   └── email: "alice@school.edu"
│   │
│   ├── 📄 STU002
│   └── 📄 ...
│
├── 📁 attendance/
│   ├── 📄 abc123xyz (auto-generated ID)
│   │   ├── studentId: "STU001"
│   │   ├── student: { id, name, class }
│   │   ├── scannedAt: Timestamp
│   │   ├── source: { ip, userAgent }
│   │   └── createdAt: Timestamp
│   │
│   ├── 📄 def456uvw
│   └── 📄 ...
│
└── 📁 attendance_by_day/
    ├── 📄 STU001_2025-12-12
    │   ├── studentId: "STU001"
    │   ├── attendanceId: "abc123xyz"
    │   ├── date: "2025-12-12"
    │   └── createdAt: Timestamp
    │
    ├── 📄 STU002_2025-12-12
    └── 📄 ...
```

### Why Three Collections?

1. **`students/`** - Master list of all students
   - Easy to update student info
   - Single source of truth

2. **`attendance/`** - All attendance records
   - Complete history
   - Can query by date, student, etc.

3. **`attendance_by_day/`** - Duplicate prevention
   - Fast lookup: Is STU001 already here today?
   - Document ID: `{studentId}_{YYYY-MM-DD}`
   - No need to query entire attendance collection

---

## 🔐 Security Layers

```
┌───────────────────────────────────────┐
│          Client Request               │
└────────────────┬──────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────┐
│  Layer 1: Rate Limiter                 │
│  • 20 requests per minute per IP       │
│  • Prevents spam/abuse                 │
└────────────────┬───────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────┐
│  Layer 2: API Key (optional)           │
│  • Check x-api-key header              │
│  • Only if API_KEY env var is set      │
└────────────────┬───────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────┐
│  Layer 3: Input Validation             │
│  • qrData must be string               │
│  • Max length 300 chars                │
│  • Type checking                       │
└────────────────┬───────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────┐
│  Layer 4: Duplicate Check              │
│  • Same student + same day = reject    │
│  • Uses attendance_by_day collection   │
└────────────────┬───────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────┐
│  Layer 5: Firestore Security Rules     │
│  • (Set in Firebase Console)           │
│  • Production: Require authentication  │
└────────────────┬───────────────────────┘
                 │
                 ↓
           ✅ Approved
```

---

## ⚡ Performance Considerations

### Why This Architecture?

1. **Duplicate Prevention with attendance_by_day**
   ```
   Without separate collection:
   - Query all attendance records for today
   - Filter by studentId
   - Could be 1000s of documents
   - SLOW ❌

   With attendance_by_day:
   - Direct document lookup
   - Key: STU001_2025-12-12
   - Single read operation
   - FAST ✅
   ```

2. **Student Lookup Optimization**
   ```
   Priority order:
   1. JSON data in QR (0 reads) ⚡
   2. Firestore lookup (1 read) 📖
   3. Empty student object (0 reads) ⚡
   ```

3. **Rate Limiting**
   ```
   Protects against:
   - Accidental infinite loops
   - Malicious spam
   - Cost control (Firestore charges per read/write)
   ```

---

## 📱 Frontend Architecture

```
scanner.html
│
├── HTML Structure
│   ├── Header
│   ├── QR Reader Container
│   ├── Status Card
│   └── Response Card
│
├── CSS Styling
│   ├── Gradient background
│   ├── Card components
│   └── Responsive design
│
└── JavaScript Logic
    │
    ├── html5-qrcode Library
    │   ├── Camera access
    │   ├── QR decoding
    │   └── Real-time scanning
    │
    ├── Debounce Logic
    │   └── Prevent duplicate scans (3s)
    │
    ├── API Communication
    │   ├── POST to backend
    │   ├── Handle responses
    │   └── Display feedback
    │
    └── UI Updates
        ├── Show scanned data
        ├── Success/error messages
        └── Auto-hide responses
```

---

## 🔄 State Management

### Scanner States

```
[Initial] ──────────────────► [Stopped]
    │                              ▲
    │ Click "Start Scanner"        │
    ▼                              │
[Starting]                         │
    │                              │
    │ Camera access granted        │
    ▼                              │
[Scanning] ◄──────────┐            │
    │                 │            │
    │ QR Detected     │ Continue   │
    ▼                 │            │
[Debounce] ───────────┘            │
    │                              │
    │ POST to Backend              │
    ▼                              │
[Processing]                       │
    │                              │
    │ Response received            │
    ▼                              │
[Display Result]                   │
    │                              │
    │ Auto-hide after 5s           │
    ▼                              │
[Scanning] (back to scanning)      │
    │                              │
    │ Click "Stop Scanner"         │
    └──────────────────────────────┘
```

---

## 🧪 Testing Flow

```
1. Unit Tests (Manual)
   ├── Test student lookup
   ├── Test duplicate prevention
   └── Test QR parsing

2. Integration Tests
   ├── Seed students ✓
   ├── Generate QR codes ✓
   └── Scan QR codes ✓

3. API Tests
   ├── Health check
   ├── Valid attendance
   ├── Invalid qrData
   ├── Duplicate attendance
   └── Rate limit

4. Frontend Tests
   ├── Camera access
   ├── QR scanning
   ├── API communication
   └── Error handling
```

---

## 📊 Monitoring & Logging

### Server Logs

```
✓ Firebase Admin initialized successfully
🚀 Server running on port 8080
   Health check: http://localhost:8080/health
   Attendance API: http://localhost:8080/attendance/scan
   API Key authentication: DISABLED
```

### Request Logs

```
POST /attendance/scan
├── Rate limiter: ✓ Passed
├── Auth: ✓ Passed (or skipped)
├── Validation: ✓ qrData valid
├── Student lookup: Found "Alice Johnson"
├── Duplicate check: ✓ No duplicate
└── Saved: attendance/abc123xyz
```

### Error Logs

```
✗ Duplicate attendance for STU001 today
✗ Rate limit exceeded for IP 127.0.0.1
✗ Invalid API key
✗ qrData exceeds max length
```

---

## 🎯 Quick Reference

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | Express + TypeScript | API server |
| Database | Firebase Firestore | Data storage |
| Frontend | HTML + JavaScript | QR scanner |
| QR Scanner | html5-qrcode | Camera access |
| QR Generator | qrcode (npm) | Generate QR codes |
| Auth | API key header | Optional security |
| Rate Limit | express-rate-limit | Prevent abuse |

---

**This architecture provides:**
- ✅ Scalability
- ✅ Security
- ✅ Performance
- ✅ Maintainability
- ✅ Extensibility
