import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ScanQR() {
  const navigate = useNavigate();
  const [scanError, setScanError] = useState(null);

  useEffect(() => {
    // Prevent multiple instances if component remounts in strict mode
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      /* verbose= */ false
    );

    const onScanSuccess = (decodedText) => {
      // Decode successful, stop scanning and navigate to verification
      scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      // decodedText should be the qrToken
      navigate(`/volunteer/verify/${encodeURIComponent(decodedText)}`);
    };

    const onScanFailure = (error) => {
      // handle scan failure, usually better to ignore and keep scanning
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner on unmount", err));
    };
  }, [navigate]);

  return (
    <div className="space-y-6 max-w-md mx-auto px-4 mt-6">
      <div className="flex items-center gap-4 pb-4">
        <Link to="/volunteer">
          <Button variant="ghost" size="icon" className="shrink-0 text-text-muted hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-brand-maroon tracking-tight">Scan Digital ID</h1>
          <p className="text-sm text-text-muted mt-1">Align the QR code within the frame.</p>
        </div>
      </div>

      <Card className="bg-bg-panel border-border-color shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div id="qr-reader" className="w-full bg-black border-none" />
        </CardContent>
      </Card>
      
      <p className="text-center text-xs text-text-muted">
        Only scan tokens presented by lost persons or their guardians. Do not scan untrusted QR codes.
      </p>
    </div>
  );
}
