import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { socket, connectSocket, disconnectSocket, joinRoom } from '../../lib/socket';
import { AlertCircle, X } from 'lucide-react';

export default function SocketManager({ children }) {
  const { user, isAuthenticated } = useAuthStore();
  const [matchAlert, setMatchAlert] = useState(null);
  const [sosAlert, setSosAlert] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    connectSocket();

    // Join appropriate rooms based on role
    if (user.role === 'superadmin') {
      joinRoom('superadmin');
    } else if (user.role === 'admin' && user.zoneId) {
      joinRoom('zone', { role: 'admin', zoneId: user.zoneId, department: 'security' });
      // In a real app we'd also join department specific rooms based on their department,
      // but 'admin:zone_id:type' is handled on the backend via broader broadcast for simplicity here,
      // or we can just rely on the superadmin/admin broadcast. 
      // Actually backend uses `admin:zone_${zoneId}:${type}` and `admin:zone_${zoneId}`.
      // We will just let the backend route it.
    } else if (user.role === 'volunteer' && user.zoneId) {
      joinRoom('zone', { role: 'volunteer', zoneId: user.zoneId, department: 'field' });
    } else if (user.role === 'visitor') {
      joinRoom('user', { userId: user._id || user.id }); // Fallback to id depending on store structure
    }

    const handleMatchAlert = (payload) => setMatchAlert(payload);
    const handleSosAlert = (payload) => {
      // Don't show modal if we're already on the SOS dashboard to avoid double annoyance,
      // but for safety, we'll show it everywhere.
      setSosAlert(payload);
    };

    socket.on('alert:match', handleMatchAlert);
    socket.on('sos:new', handleSosAlert);

    return () => {
      socket.off('alert:match', handleMatchAlert);
      socket.off('sos:new', handleSosAlert);
    };
  }, [isAuthenticated, user]);

  return (
    <>
      {children}
      
      {/* Global SOS Alert Modal/Toast */}
      {sosAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-status-sos max-w-sm w-full overflow-hidden animate-in zoom-in-95">
            <div className="bg-status-sos text-white px-4 py-4 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 mb-2 animate-bounce" />
              <h2 className="text-xl font-black uppercase tracking-widest">SOS Triggered</h2>
            </div>
            <div className="p-6 text-center">
              <p className="text-lg font-bold uppercase tracking-wider mb-1">
                {sosAlert.type} Emergency
              </p>
              <p className="text-text-muted mb-6">
                Zone ID: <span className="font-mono text-text-primary">{sosAlert.zoneId}</span>
              </p>
              
              <button 
                onClick={() => setSosAlert(null)}
                className="w-full bg-bg-base border-2 border-border-color px-4 py-3 rounded font-bold hover:bg-gray-100 transition-colors uppercase tracking-wider"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Match Alert Modal/Toast */}
      {matchAlert && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-status-sos max-w-md w-full overflow-hidden animate-in slide-in-from-top-4">
            <div className="bg-status-sos text-white px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                <AlertCircle className="w-5 h-5 animate-pulse" />
                Match Detected!
              </div>
              <button 
                onClick={() => setMatchAlert(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-text-primary font-medium mb-3">
                {matchAlert.message}
              </p>
              <div className="space-y-1 text-sm text-text-muted">
                <p>Zone ID: <span className="font-mono text-text-primary">{matchAlert.zoneId}</span></p>
                {matchAlert.confidence && (
                  <p>Confidence: <span className="font-mono text-text-primary">{(matchAlert.confidence * 100).toFixed(1)}%</span></p>
                )}
                <p>Time: {new Date(matchAlert.timestamp).toLocaleTimeString()}</p>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setMatchAlert(null)}
                  className="bg-bg-base border border-border-color px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors text-sm"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
