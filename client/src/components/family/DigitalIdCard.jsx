import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function DigitalIdCard({ member }) {
  const isIssued = member.physicalBandIssued;

  return (
    <Card className="bg-bg-panel border-border-color shadow-sm overflow-hidden flex flex-col relative">
      {/* Top Banner indicating status */}
      <div className={cn(
        "px-4 py-2 text-xs font-semibold tracking-wider uppercase text-white flex items-center gap-2",
        isIssued ? "bg-status-low" : "bg-status-medium"
      )}>
        {isIssued ? (
          <>
            <ShieldCheck className="w-4 h-4" />
            Physical Band Issued
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            Digital Token Only
          </>
        )}
      </div>

      <CardContent className="p-6 flex flex-col items-center">
        {/* The QR Code - Scannable at a distance */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-border-color mb-4">
          <QRCodeSVG 
            value={member.digitalQR || ''} 
            size={180} 
            level="H" 
            includeMargin={false} 
            className="w-full h-auto"
          />
        </div>
        
        <h3 className="text-xl font-serif text-brand-maroon text-center leading-tight">
          {member.name}
        </h3>
        
        <div className="mt-2 text-center text-sm text-text-muted space-y-1">
          <p>Age: <span className="font-medium text-text-primary tabular-nums">{member.age}</span></p>
          <p>ID: <span className="font-mono text-xs text-text-primary break-all">{member._id}</span></p>
        </div>
      </CardContent>
    </Card>
  );
}
