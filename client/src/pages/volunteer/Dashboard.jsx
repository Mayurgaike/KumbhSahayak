import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { ScanLine, ShieldAlert } from 'lucide-react';

export default function VolunteerDashboard() {
  return (
    <div className="space-y-6 max-w-md mx-auto px-4 mt-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-serif text-brand-maroon tracking-tight">Field Volunteer HQ</h1>
        <p className="text-sm text-text-muted mt-2 font-medium">Verify. Protect. Reunite.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Link to="/volunteer/issue-band/scan">
          <Card className="bg-bg-panel border-border-color shadow-sm hover:border-accent-primary transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-status-medium/10 text-status-medium rounded-full group-hover:scale-105 transition-transform">
                <ScanLine className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Issue Wristband</h3>
                <p className="text-sm text-text-muted">Scan digital QR at checkpoint to issue physical band.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/volunteer/scan">
          <Card className="bg-bg-panel border-border-color shadow-sm hover:border-accent-primary transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-accent-gold/10 text-accent-gold rounded-full group-hover:scale-105 transition-transform">
                <ScanLine className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Verify Lost Person</h3>
                <p className="text-sm text-text-muted">Scan digital ID to reveal guardian info.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        {/* Placeholder for future SOS response module */}
        <Card className="bg-bg-panel border-border-color shadow-sm opacity-50 cursor-not-allowed">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-status-sos/10 text-status-sos rounded-full">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">SOS Alerts (WIP)</h3>
              <p className="text-sm text-text-muted">Respond to active emergencies nearby.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
