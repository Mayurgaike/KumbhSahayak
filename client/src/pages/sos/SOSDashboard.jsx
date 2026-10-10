import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, AlertTriangle, HeartPulse, ShieldAlert, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { socket } from '../../lib/socket';

const getSOSIcon = (type) => {
  switch (type) {
    case 'medical': return <HeartPulse className="w-5 h-5" />;
    case 'police/security': return <ShieldAlert className="w-5 h-5" />;
    case 'mass-incident': return <AlertTriangle className="w-5 h-5" />;
    default: return <AlertTriangle className="w-5 h-5" />;
  }
};

const getSOSStyles = (type) => {
  switch (type) {
    case 'medical': return {
      border: 'border-red-400',
      headerBg: 'bg-red-600 text-white',
      iconBg: 'bg-red-100 text-red-700',
    };
    case 'police/security': return {
      border: 'border-blue-400',
      headerBg: 'bg-blue-600 text-white',
      iconBg: 'bg-blue-100 text-blue-700',
    };
    case 'mass-incident': return {
      border: 'border-red-600',
      headerBg: 'bg-gray-900 text-red-400',
      iconBg: 'bg-red-900 text-red-300',
    };
    default: return {
      border: 'border-red-400',
      headerBg: 'bg-red-600 text-white',
      iconBg: 'bg-red-100 text-red-700',
    };
  }
};

export default function SOSDashboard() {
  const { user } = useAuthStore();
  const [sosList, setSosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const backLink = isAdmin ? '/admin' : '/volunteer';

  useEffect(() => {
    const fetchSOS = async () => {
      try {
        const res = await api.get('/api/sos');
        setSosList(res.data.sos);
      } catch (err) {
        setError('Failed to fetch emergencies.');
      } finally {
        setLoading(false);
      }
    };
    fetchSOS();

    const handleNewSOS = () => fetchSOS();
    socket.on('sos:new', handleNewSOS);
    return () => socket.off('sos:new', handleNewSOS);
  }, []);

  const handleAssign = async (id) => {
    try {
      await api.patch(`/api/sos/${id}/assign`);
      setSosList(prev => prev.map(s => s._id === id ? { ...s, status: 'assigned', assignedTo: { _id: user._id || user.id, name: user.name } } : s));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to assign SOS.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-status-sos" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back arrow */}
      <div className="flex items-start gap-4 border-b border-border-color pb-4">
        <Link to={backLink}>
          <Button variant="ghost" size="icon" className="shrink-0 text-text-muted hover:text-text-primary mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className={cn("text-2xl font-black tracking-tight uppercase", isAdmin ? "text-accent-gold" : "text-brand-maroon")}>
              SOS Dispatch
            </h1>
            <p className="text-sm text-text-muted mt-1 font-mono">
              LIVE EMERGENCY FEED
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-status-sos/10 text-status-sos px-3 py-1.5 rounded border border-status-sos/20">
            <div className="w-2 h-2 rounded-full bg-status-sos animate-pulse"></div>
            {sosList.length} ACTIVE
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-sos/10 text-status-sos rounded-md text-sm border border-status-sos/20">
          {error}
        </div>
      )}

      {sosList.length === 0 ? (
        <div className={cn("p-12 text-center rounded border border-dashed border-border-color", isAdmin ? "bg-bg-panel/50" : "bg-white")}>
          <CheckCircle className="w-12 h-12 text-status-success mx-auto mb-3 opacity-50" />
          <p className="text-text-muted font-mono uppercase tracking-wider text-sm">No Active Emergencies</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sosList.map((sos) => {
            const styles = getSOSStyles(sos.type);
            return (
              <Card key={sos._id} className={cn(
                "border-2 overflow-hidden flex flex-col",
                isAdmin ? "bg-bg-panel" : "bg-white",
                styles.border
              )}>
                {/* Header stripe */}
                <div className={cn("px-4 py-3 flex justify-between items-center font-bold uppercase tracking-widest text-sm", styles.headerBg)}>
                  <span className="flex items-center gap-2">
                    {getSOSIcon(sos.type)}
                    {sos.type}
                  </span>
                  <span className="opacity-80 font-mono text-xs">{new Date(sos.createdAt).toLocaleTimeString()}</span>
                </div>
                
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                    <p className="text-xs uppercase font-bold text-text-muted tracking-wider mb-1">Location</p>
                    <p className="text-lg font-black text-text-primary">{sos.zoneId?.name || sos.zoneId}</p>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs uppercase font-bold text-text-muted tracking-wider mb-1">Reported By</p>
                    <p className="font-mono text-sm text-text-primary">{sos.raisedBy?.name} ({sos.raisedBy?.phone})</p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border-color">
                    {sos.status === 'open' ? (
                      <Button 
                        onClick={() => handleAssign(sos._id)}
                        className="w-full font-bold uppercase tracking-wider bg-status-sos hover:bg-red-700 text-white"
                      >
                        Assign to me
                      </Button>
                    ) : (
                      <div className="bg-emerald-50 p-3 rounded text-center border border-emerald-200">
                        <p className="text-xs uppercase font-bold tracking-wider mb-1 flex items-center justify-center gap-1 text-emerald-700">
                          <CheckCircle className="w-3 h-3" /> Responding
                        </p>
                        <p className="font-mono text-sm font-bold text-emerald-800">{sos.assignedTo?.name || 'Assigned'}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
