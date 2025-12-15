import { Html5QrcodeScanner } from 'html5-qrcode';
import React, { useEffect, useRef, useState } from 'react';

// Backend API URL - change this to your deployed backend URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const QRScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<string>('');
  const [backendResponse, setBackendResponse] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    setScanResult(decodedText);
    setError('');

    try {
      const response = await fetch(`${API_URL}/attendance/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData: decodedText }),
      });

      const data = await response.json();
      setBackendResponse(JSON.stringify(data));
    } catch (err) {
      setBackendResponse('Error: ' + (err as Error).message);
    }
  };

  const onScanFailure = (error: any) => {
    console.warn(`Code scan error = ${error}`);
  };

  const startScanning = () => {
    setError('');
    scannerRef.current = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scannerRef.current.render(onScanSuccess, onScanFailure);
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        setIsScanning(false);
        setScanResult('');
        setBackendResponse('');
      }).catch((err) => {
        setError('Error stopping scanner: ' + err);
      });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>QR Code Scanner</h1>
      <button onClick={isScanning ? stopScanning : startScanning}>
        {isScanning ? 'Stop Scanning' : 'Start Scanning'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div id="reader" style={{ width: '100%', maxWidth: '500px' }}></div>
      {scanResult && (
        <div>
          <h2>Scanned QR Code:</h2>
          <p>{scanResult}</p>
        </div>
      )}
      {backendResponse && (
        <div>
          <h2>Backend Response:</h2>
          <p>{backendResponse}</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
