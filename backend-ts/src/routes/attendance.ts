import { Request, Response, Router } from "express";
import admin from "firebase-admin";
import { db } from "../firebaseConfig.js";

const router = Router();

/**
 * POST /attendance - Save QR data to Firebase (Scanner Integration)
 * Accepts structured QR data from the scanner and stores it in Firebase
 */
router.post(
  "/",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { name, email, eventId, qrData, timestamp, scannedAt } = req.body;

      // Validate required fields
      if (!qrData || typeof qrData !== "string") {
        return res.status(400).json({ error: "Invalid qrData" });
      }

      // Create attendance record
      const attendanceCollection = process.env.FIRESTORE_COLLECTION || "attendance";
      const attendanceRecord = {
        name: name || "Unknown",
        email: email || "",
        eventId: eventId || "",
        qrData,
        timestamp: timestamp || Date.now(),
        scannedAt: scannedAt || new Date().toISOString(),
        recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      };

      const docRef = await db.collection(attendanceCollection).add(attendanceRecord);

      // Return response in the format expected by scanner
      return res.status(201).json({
        id: docRef.id,
        name: attendanceRecord.name,
        email: attendanceRecord.email,
        timestamp: attendanceRecord.timestamp,
        qrData: attendanceRecord.qrData,
      });
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
  }
);

/**
 * GET /attendance - Fetch all attendance from Firebase
 * Returns all attendance records in an array format
 */
router.get(
  "/",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const attendanceCollection = process.env.FIRESTORE_COLLECTION || "attendance";

      const snapshot = await db
        .collection(attendanceCollection)
        .orderBy("scannedAt", "desc")
        .get();

      const records = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.student?.name || "Unknown",
          email: data.email || data.student?.email || "",
          timestamp: data.timestamp || data.scannedAt?.toMillis?.() || Date.now(),
          qrData: data.qrData || "",
          scannedAt: data.scannedAt,
          eventId: data.eventId || "",
        };
      });

      // Return direct array as per documentation
      return res.json(records);
    } catch (error: any) {
      console.error("Error fetching attendance:", error);
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
  }
);

/**
 * POST /attendance/scan - Record attendance from QR scan
 */
router.post(
  "/scan",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { qrData, extra, scannedAt } = req.body;

      // Validate qrData
      if (!qrData || typeof qrData !== "string" || qrData.length > 300) {
        return res.status(400).json({ error: "Invalid qrData" });
      }

      let studentId: string;
      let student: any = {};

      // Try to parse qrData as JSON
      try {
        const parsed = JSON.parse(qrData);
        if (parsed.id) {
          studentId = parsed.id;
          student = parsed;
        } else {
          studentId = qrData;
        }
      } catch {
        // Not JSON, treat as plain student ID
        studentId = qrData;
      }

      // If we still don't have student details, try to look up from extra or Firestore
      if (!student.id && extra && extra.id) {
        student = extra;
        studentId = extra.id;
      } else if (!student.id) {
        // Try to lookup student from Firestore
        const studentsCollection =
          process.env.FIRESTORE_STUDENTS_COLLECTION || "students";
        const studentDoc = await db.collection(studentsCollection).doc(studentId).get();

        if (studentDoc.exists) {
          student = studentDoc.data();
        }
      }

      // Check for duplicate attendance (same student, same day)
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const attendanceByDayId = `${studentId}_${today}`;
      const attendanceByDayDoc = await db
        .collection("attendance_by_day")
        .doc(attendanceByDayId)
        .get();

      if (attendanceByDayDoc.exists) {
        return res.status(400).json({
          error: "Duplicate attendance",
          message: `Attendance already recorded for student ${studentId} today`,
        });
      }

      // Record attendance
      const attendanceCollection = process.env.FIRESTORE_COLLECTION || "attendance";
      const attendanceRecord = {
        studentId,
        student,
        scannedAt: scannedAt || admin.firestore.FieldValue.serverTimestamp(),
        source: {
          ip: req.ip,
          userAgent: req.get("user-agent"),
        },
      };

      const docRef = await db.collection(attendanceCollection).add(attendanceRecord);

      // Mark attendance for today to prevent duplicates
      await db.collection("attendance_by_day").doc(attendanceByDayId).set({
        studentId,
        date: today,
        recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(201).json({
        id: docRef.id,
        message: "Attendance recorded successfully",
        studentId,
        student,
      });
    } catch (error: any) {
      console.error("Error recording attendance:", error);
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
  }
);

/**
 * GET /attendance/list - List recent attendance records
 */
router.get(
  "/list",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const attendanceCollection = process.env.FIRESTORE_COLLECTION || "attendance";

      const snapshot = await db
        .collection(attendanceCollection)
        .orderBy("scannedAt", "desc")
        .limit(limit)
        .get();

      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.json({ records, count: records.length });
    } catch (error: any) {
      console.error("Error listing attendance:", error);
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
  }
);

export default router;
