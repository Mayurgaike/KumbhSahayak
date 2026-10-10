import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Loader2, AlertTriangle, ShieldAlert, HeartPulse, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function RaiseSOS() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for queued SOS
    const queued = localStorage.getItem('kumbh_sos_queue');
    if (queued) {
      setOfflineQueue(JSON.parse(queued));
    }

    const fetchZones = async () => {
      try {
        const res = await api.get('/api/zones/public/status'); // Using public route since it lists active zones
        setZones(res.data.zones || []);
      } catch (err) {
        console.error('Failed to fetch zones for SOS');
      } finally {
        setLoading(false);
      }
    };
    fetchZones();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process offline queue when back online
  useEffect(() => {
    if (!isOffline && offlineQueue.length > 0) {
      const processQueue = async () => {
        const pending = [...offlineQueue];
        const failed = [];
        
        for (const item of pending) {
          try {
            await api.post('/api/sos', { type: item.type, zoneId: item.zoneId });
          } catch (err) {
            failed.push(item);
          }
        }
        
        setOfflineQueue(failed);
        if (failed.length === 0) {
          localStorage.removeItem('kumbh_sos_queue');
          alert('Offline SOS alerts have now been transmitted successfully!');
        } else {
          localStorage.setItem('kumbh_sos_queue', JSON.stringify(failed));
        }
      };
      processQueue();
    }
  }, [isOffline, offlineQueue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedZone || !selectedType) return;
    
    setSubmitting(true);
    
    const payload = { type: selectedType, zoneId: selectedZone };

    if (isOffline) {
      // Queue offline
      const newQueue = [...offlineQueue, { ...payload, timestamp: Date.now() }];
      setOfflineQueue(newQueue);
      localStorage.setItem('kumbh_sos_queue', JSON.stringify(newQueue));
      setSubmitting(false);
      alert('You are offline. The SOS has been queued and will transmit the moment connection is restored.');
      navigate(user.role === 'visitor' ? '/visitor' : '/volunteer');
      return;
    }

    try {
      await api.post('/api/sos', payload);
      alert('SOS Transmitted successfully! Help is on the way.');
      navigate(user.role === 'visitor' ? '/visitor' : '/volunteer');
    } catch (err) {
      alert('Failed to transmit SOS. Please try again or find a volunteer.');
    } finally {
      setSubmitting(false);
    }
  };

  const isVolunteer = user?.role === 'volunteer';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-status-sos" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-20">
      <div className="flex items-center gap-4 pb-4">
        <Link to={user.role === 'visitor' ? '/visitor' : '/volunteer'}>
          <Button variant="ghost" size="icon" className="shrink-0 text-text-muted hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-status-sos uppercase tracking-tight">SOS Emergency</h1>
        </div>
      </div>

      {isOffline && (
        <div className="bg-status-high/10 text-status-high p-4 rounded-md mb-6 flex items-start gap-3 border border-status-high/20">
          <WifiOff className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm uppercase">Offline Mode</h3>
            <p className="text-xs mt-1">You have no internet connection. If you trigger an SOS, it will be saved locally and transmitted the second your connection returns.</p>
          </div>
        </div>
      )}

      {offlineQueue.length > 0 && !isOffline && (
        <div className="bg-blue-50 text-blue-700 p-4 rounded-md mb-6 flex items-start gap-3 border border-blue-200">
          <Loader2 className="w-5 h-5 shrink-0 mt-0.5 animate-spin" />
          <div>
            <h3 className="font-bold text-sm uppercase">Syncing Queued SOS</h3>
            <p className="text-xs mt-1">Transmitting {offlineQueue.length} offline alerts...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">
            1. Select Emergency Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedType('medical')}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all",
                selectedType === 'medical' 
                  ? "bg-status-sos/10 border-status-sos text-status-sos shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                  : "bg-bg-panel border-border-color hover:border-gray-300 text-text-muted"
              )}
            >
              <HeartPulse className="w-8 h-8 mb-2" />
              <span className="font-bold uppercase tracking-wider text-sm">Medical</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('police/security')}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all",
                selectedType === 'police/security' 
                  ? "bg-blue-500/10 border-blue-500 text-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                  : "bg-bg-panel border-border-color hover:border-gray-300 text-text-muted"
              )}
            >
              <ShieldAlert className="w-8 h-8 mb-2" />
              <span className="font-bold uppercase tracking-wider text-sm">Security</span>
            </button>
            
            {isVolunteer && (
              <button
                type="button"
                onClick={() => setSelectedType('mass-incident')}
                className={cn(
                  "col-span-2 flex flex-col items-center justify-center p-6 rounded-lg border-4 transition-all",
                  selectedType === 'mass-incident' 
                    ? "bg-black border-status-sos text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]" 
                    : "bg-gray-900 border-gray-700 hover:border-gray-500 text-gray-400"
                )}
              >
                <AlertTriangle className="w-8 h-8 mb-2 text-status-sos" />
                <span className="font-black uppercase tracking-widest text-lg">Mass Incident</span>
                <span className="text-[10px] mt-1 opacity-70">Stampede / Riot (Bypasses normal routing)</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold uppercase tracking-widest text-text-muted">
            2. Select Location
          </label>
          <select 
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full bg-bg-panel border-2 border-border-color rounded-md px-4 py-4 font-bold focus:border-accent-primary outline-none"
            required
          >
            <option value="" disabled>-- Choose Current Zone --</option>
            {zones.map(z => (
              <option key={z._id} value={z._id}>{z.name}</option>
            ))}
          </select>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={submitting || !selectedType || !selectedZone}
            className="w-full h-20 text-xl font-black uppercase tracking-widest bg-status-sos hover:bg-red-700 text-white transition-all shadow-[0_10px_20px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : "TRIGGER SOS"}
          </Button>
        </div>
      </form>
    </div>
  );
}
