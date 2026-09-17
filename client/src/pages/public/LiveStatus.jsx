import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { socket, connectSocket, disconnectSocket } from '../../lib/socket';
import { Card, CardContent } from '../../components/ui/Card';
import { Loader2, Users, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

// Maps density level from DB to our visual classes
const getDensityStyles = (level) => {
  switch (level?.toLowerCase()) {
    case 'critical':
      return 'bg-status-sos/10 text-status-sos border-status-sos/20';
    case 'high':
      return 'bg-status-high/10 text-status-high border-status-high/20';
    case 'medium':
      return 'bg-status-medium/10 text-status-medium border-status-medium/20';
    case 'low':
      return 'bg-status-low/10 text-status-low border-status-low/20';
    default:
      return 'bg-gray-100 text-gray-500 border-gray-200';
  }
};

export default function LiveStatus() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Fetch initial public status
    const fetchStatuses = async () => {
      try {
        const res = await api.get('/api/zones/public/status');
        setZones(res.data.zones);
      } catch (err) {
        setError('Failed to load live status. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatuses();

    // 2. Connect to socket for live updates (no auth required for global broadcast)
    connectSocket();

    const handleZoneUpdate = (payload) => {
      // payload: { zoneId, peopleCount, densityLevel, timestamp }
      setZones(prev => prev.map(zone => {
        if (zone._id === payload.zoneId) {
          return {
            ...zone,
            currentDensity: payload.densityLevel,
            currentHeadcount: payload.peopleCount
          };
        }
        return zone;
      }));
    };

    socket.on('zone:status', handleZoneUpdate);

    return () => {
      socket.off('zone:status', handleZoneUpdate);
      disconnectSocket();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-bg-base">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif text-brand-maroon tracking-tight mb-2">Live Crowd Status</h1>
          <p className="text-text-muted">Real-time density updates to help you navigate safely.</p>
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full border border-green-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Updates Active
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm text-center mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {zones.map((zone) => (
            <Card key={zone._id} className={cn("border-2 transition-colors", getDensityStyles(zone.currentDensity))}>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-1 text-text-primary">{zone.name}</h3>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
                    {zone.currentDensity === 'critical' || zone.currentDensity === 'high' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                    {zone.currentDensity || 'Unknown'} Density
                  </div>
                  <div className="text-2xl font-mono tracking-tighter opacity-80">
                    {zone.currentHeadcount || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
