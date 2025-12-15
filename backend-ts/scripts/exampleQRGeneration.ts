// scripts/exampleQRGeneration.ts
// Example: Generate a single QR code for testing

import { generateQR, saveQRToFile } from "../src/utils/generateQR.js";

async function example() {
  console.log("QR Code Generation Examples\n");

  // Example 1: Generate QR code as data URL (for web display)
  const dataURL = await generateQR("STU001");
  console.log("1. Data URL (first 50 chars):", dataURL.substring(0, 50) + "...");

  // Example 2: Generate QR with JSON data
  const studentData = {
    id: "STU001",
    name: "Alice Johnson",
    class: "10A",
  };
  const jsonDataURL = await generateQR(studentData);
  console.log("2. JSON Data URL (first 50 chars):", jsonDataURL.substring(0, 50) + "...");

  // Example 3: Save QR code to file
  await saveQRToFile("STU001", "./test-qr-simple.png");
  console.log("3. ✓ Saved simple QR to: ./test-qr-simple.png");

  // Example 4: Save QR code with JSON data to file
  await saveQRToFile(studentData, "./test-qr-json.png");
  console.log("4. ✓ Saved JSON QR to: ./test-qr-json.png");

  console.log("\n✅ Done! Check the generated PNG files.");
}

example().catch(console.error);
