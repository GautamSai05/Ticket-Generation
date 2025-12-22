# Backend Integration Guide for Firebase

## 🔧 What Changed

The scanner now correctly sends JSON data to your backend and fetches Firebase data.

---

## ✅ Scanner Configuration

### Sends Parsed QR Data
When a QR code is scanned, the system now:
1. **Parses QR code** to extract JSON data
2. **Sends structured payload** to backend:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "eventId": "EVENT123",
  "qrData": "original_qr_string",
  "timestamp": 1703234567890,
  "scannedAt": "2025-12-22T10:30:00.000Z"
}
```

### Multiple Endpoint Support
The system tries these endpoints in order:
1. `/attendance` (primary)
2. `/api/attendance` (if 404)
3. `/mark-attendance` (if 404)

---

## 🎯 Backend Requirements

### Your backend needs to:

#### 1. Accept POST Request
**Endpoint:** Any of the above (configure in `.env`)
**Method:** POST
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer YOUR_API_KEY` (optional)
- `x-api-key: YOUR_API_KEY` (optional)

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "eventId": "string",
  "qrData": "string",
  "timestamp": 1234567890,
  "scannedAt": "2025-12-22T10:30:00.000Z"
}
```

**Response:**
```json
{
  "id": "firebase_doc_id",
  "name": "John Doe",
  "email": "john@example.com",
  "timestamp": 1234567890,
  "qrData": "original_qr_string"
}
```

#### 2. Return Attendance List (GET)
**Endpoint:** Any of `/attendance`, `/api/attendance`, `/get-attendance`
**Method:** GET
**Headers:** Same as POST

**Response:** (Any of these formats work)
```json
// Option 1: Direct array
[
  {
    "id": "doc1",
    "name": "John Doe",
    "email": "john@example.com",
    "timestamp": 1234567890,
    "qrData": "..."
  }
]

// Option 2: Wrapped in data property
{
  "data": [ ...attendance records... ]
}

// Option 3: Wrapped in attendance property
{
  "attendance": [ ...attendance records... ]
}
```

---

## 🔍 Debugging

### Check Browser Console
The system logs everything:
```
Sending attendance data to backend: {...}
Backend response: {...}
Fetching attendance from Firebase backend...
Fetched attendance from Firebase: [...]
```

### Common Issues

**"Not found" error:**
- Backend endpoint doesn't match
- Set correct endpoint in `.env` file:
```env
VITE_API_BASE_URL=https://your-backend-url.com
```

**Data not saving:**
- Check backend logs
- Verify Firebase connection
- Check API key if required

**CORS errors:**
- Backend needs CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key
```

---

## ⚙️ Configuration

### In `.env` file:
```env
# Your backend URL
VITE_API_BASE_URL=https://ticket-generation-3.onrender.com

# API key (if required)
VITE_API_KEY=your_actual_api_key

# Custom endpoints (if different)
VITE_SUBMIT_ENDPOINT=/attendance
VITE_FETCH_ENDPOINT=/attendance
```

---

## 📊 Data Flow

```
1. User scans QR code
   ↓
2. Frontend parses QR JSON
   ↓
3. Send to backend POST /attendance
   ↓
4. Backend saves to Firebase
   ↓
5. Backend returns saved document
   ↓
6. Frontend shows success message

---

To view attendance:
1. User opens /admin/attendance
   ↓
2. Frontend calls GET /attendance
   ↓
3. Backend fetches from Firebase
   ↓
4. Backend returns array of records
   ↓
5. Frontend displays in table
```

---

## 🧪 Testing

### Test QR Code Format
Your QR codes should contain JSON:
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "eventId": "EVENT123"
}
```

### Test Backend Manually
```bash
# Test POST
curl -X POST https://your-backend.com/attendance \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","qrData":"test123","timestamp":1234567890}'

# Test GET
curl https://your-backend.com/attendance
```

---

## ✨ Features

- ✅ Sends parsed JSON data from QR codes
- ✅ Includes timestamp and scannedAt fields
- ✅ Tries multiple endpoint paths automatically
- ✅ Comprehensive console logging
- ✅ Handles different response formats
- ✅ Configurable via .env file
- ✅ API key support (optional)
- ✅ CORS enabled

---

## 📞 Support

If still having issues:
1. Check browser console for errors
2. Share console logs with backend team
3. Verify backend endpoint is correct
4. Test backend with curl commands above
5. Check Firebase connection on backend
