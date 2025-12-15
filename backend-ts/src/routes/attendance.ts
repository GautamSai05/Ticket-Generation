import { Request, Response, Router } from "express";
import admin from "firebase-admin";
import { db } from "../firebaseConfig.js";

const router = Router();

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
