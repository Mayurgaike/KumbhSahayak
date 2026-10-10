import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AlertTriangle, ScanLine, ShieldAlert, Map, ListTodo, MessageSquare } from 'lucide-react';

export default function VolunteerDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border-color pb-4">
        <h1 className="text-2xl sm:text-3xl font-serif text-brand-maroon tracking-tight">Field Volunteer HQ</h1>
        <p className="text-sm text-text-muted mt-1 font-medium">Verify. Protect. Reunite.</p>
      </div>

      {/* Quick-access toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/volunteer/tasks">
          <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 border-border-color text-text-primary hover:bg-brand-maroon/5">
            <ListTodo className="w-5 h-5 text-brand-maroon" />
            <span className="text-xs uppercase tracking-wider font-bold">My Tasks</span>
          </Button>
        </Link>
        <Link to="/volunteer/chat">
          <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 border-border-color text-text-primary hover:bg-amber-50">
            <MessageSquare className="w-5 h-5 text-amber-700" />
            <span className="text-xs uppercase tracking-wider font-bold">Zone Comms</span>
          </Button>
        </Link>
        <Link to="/navigation">
          <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 border-border-color text-text-primary hover:bg-emerald-50">
            <Map className="w-5 h-5 text-emerald-600" />
            <span className="text-xs uppercase tracking-wider font-bold">Crowd Map</span>
          </Button>
        </Link>
        <Link to="/volunteer/sos/raise">
          <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 border-status-sos/30 text-text-primary hover:bg-red-50">
            <AlertTriangle className="w-5 h-5 text-status-sos" />
            <span className="text-xs uppercase tracking-wider font-bold">Emergency</span>
          </Button>
        </Link>
      </div>

      {/* Main action cards - responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Link to="/volunteer/issue-band/scan">
          <Card className="bg-bg-panel border-border-color shadow-sm hover:border-brand-maroon/50 hover:shadow-md transition-all cursor-pointer group h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <ScanLine className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Issue Wristband</h3>
                <p className="text-sm text-text-muted mt-0.5">Scan digital QR at checkpoint to issue physical band.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/volunteer/scan">
          <Card className="bg-bg-panel border-border-color shadow-sm hover:border-brand-maroon/50 hover:shadow-md transition-all cursor-pointer group h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-blue-100 text-blue-700 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <ScanLine className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Verify Lost Person</h3>
                <p className="text-sm text-text-muted mt-0.5">Scan digital ID to reveal guardian info.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/volunteer/cases">
          <Card className="bg-bg-panel border-border-color shadow-sm hover:border-status-sos/50 hover:shadow-md transition-all cursor-pointer group h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-red-100 text-status-sos rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Active Cases</h3>
                <p className="text-sm text-text-muted mt-0.5">View and resolve lost person reports.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/volunteer/sos">
          <Card className="bg-status-sos/5 border-2 border-status-sos/30 shadow-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all cursor-pointer group h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-status-sos/15 text-status-sos rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <ShieldAlert className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary uppercase tracking-wider">SOS Dispatch</h3>
                <p className="text-sm text-text-muted mt-0.5">Respond to active medical/security emergencies.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
