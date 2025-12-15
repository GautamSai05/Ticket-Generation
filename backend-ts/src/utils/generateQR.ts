// src/utils/generateQR.ts
// Utility functions for generating QR codes

import QRCode from "qrcode";

/**
 * Generate a QR code as a data URL
 * @param data - String or object to encode in QR code
 * @returns Promise<string> - Data URL of the QR code image
 */
export async function generateQR(data: string | object): Promise<string> {
  try {
    const qrData = typeof data === "string" ? data : JSON.stringify(data);
    const dataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
    });
    return dataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

/**
 * Save a QR code to a file
 * @param data - String or object to encode in QR code
 * @param filePath - Path where to save the QR code image
 */
export async function saveQRToFile(data: string | object, filePath: string): Promise<void> {
  try {
    const qrData = typeof data === "string" ? data : JSON.stringify(data);
    await QRCode.toFile(filePath, qrData, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
    });
    console.log(`QR code saved to ${filePath}`);
  } catch (error) {
    console.error("Error saving QR code to file:", error);
    throw error;
  }
}

/**
 * Generate QR code as a buffer (useful for sending in HTTP responses)
 * @param data - String or object to encode in QR code
 * @returns Promise<Buffer> - PNG image buffer
 */
export async function generateQRBuffer(data: string | object): Promise<Buffer> {
  try {
    const qrData = typeof data === "string" ? data : JSON.stringify(data);
    const buffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
    });
    return buffer;
  } catch (error) {
    console.error("Error generating QR code buffer:", error);
    throw error;
  }
}
