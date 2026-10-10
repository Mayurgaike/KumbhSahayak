import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { socket, connectSocket, disconnectSocket, joinRoom } from '../../lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, Users, AlertTriangle, Map, ShieldAlert, UserPlus, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

const getDensityStyles = (level) => {
  switch (level?.toLowerCase()) {
    case 'critical':
      return 'bg-status-sos/20 text-status-sos border-status-sos shadow-[0_0_15px_rgba(239,68,68,0.5)]';
    case 'high':
      return 'bg-status-high/20 text-status-high border-status-high';
    case 'medium':
      return 'bg-status-medium/20 text-status-medium border-status-medium';
    case 'low':
      return 'bg-status-low/20 text-status-low border-status-low';
    default:
      return 'bg-gray-800 text-gray-400 border-gray-700';
  }
};

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await api.get('/api/zones/status');
        setZones(res.data.zones);
      } catch (err) {
        console.error('Failed to load zones', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatuses();

    const handleZoneUpdate = (payload) => {
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

    const handleAlert = (payload) => {
      // payload: { zoneId, message, peopleCount, timestamp }
      setActiveAlert(payload);
      
      // Auto-hide alert after 10 seconds if no new alerts come in
      setTimeout(() => {
        setActiveAlert(null);
      }, 10000);
    };

    socket.on('zone:status', handleZoneUpdate);
    socket.on('alert:zone', handleAlert);

    return () => {
      socket.off('zone:status', handleZoneUpdate);
      socket.off('alert:zone', handleAlert);
      disconnectSocket();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-border-color pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Command Center</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">LIVE // CROWD TELEMETRY</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-status-success/10 text-status-success px-3 py-1.5 rounded border border-status-success/20">
          <div className="w-2 h-2 rounded-full bg-status-success animate-pulse"></div>
          SYSTEM ONLINE
        </div>
      </div>

      {activeAlert && (
        <div className="bg-status-sos border-l-4 border-white text-white p-4 shadow-lg flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h3 className="font-bold uppercase tracking-wider text-sm mb-1">High Density Alert</h3>
            <p className="text-sm">
              {activeAlert.message} (Zone ID: <span className="font-mono">{activeAlert.zoneId}</span>)
            </p>
            <p className="text-xs mt-2 opacity-80 font-mono">HEADCOUNT: {activeAlert.peopleCount} • {new Date(activeAlert.timestamp).toLocaleTimeString()}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => (
          <Card key={zone._id} className={cn("border-2 bg-bg-base transition-all duration-300", getDensityStyles(zone.currentDensity))}>
            <CardHeader className="pb-2 border-b border-black/20">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center justify-between">
                <span>{zone.name}</span>
                <Map className="w-4 h-4 opacity-50" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-mono opacity-60 uppercase mb-1">Status</p>
                  <p className="text-lg font-bold uppercase tracking-wider">{zone.currentDensity || 'UNKNOWN'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono opacity-60 uppercase mb-1">Headcount</p>
                  <p className="text-3xl font-mono tabular-nums leading-none flex items-center justify-end gap-2">
                    <Users className="w-5 h-5 opacity-50" />
                    {zone.currentHeadcount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {zones.length === 0 && (
          <div className="col-span-full p-8 text-center border border-dashed border-border-color rounded bg-bg-base/50">
            <p className="text-text-muted font-mono">NO ZONES DETECTED</p>
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-border-color pt-6">
        <h2 className="text-lg font-bold mb-4">Operations</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/cases" className="bg-bg-panel border-2 border-accent-gold hover:bg-accent-gold hover:text-white transition-colors px-6 py-4 rounded-md flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <div className="text-left">
              <p className="font-bold uppercase tracking-widest text-sm">Lost Persons</p>
              <p className="text-xs opacity-80 font-mono">View Active Cases</p>
            </div>
          </Link>

          <Link to="/admin/sos" className="bg-bg-panel border-2 border-status-sos hover:bg-status-sos hover:text-white transition-colors px-6 py-4 rounded-md flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" />
            <div className="text-left">
              <p className="font-bold uppercase tracking-widest text-sm">SOS Dispatch</p>
              <p className="text-xs opacity-80 font-mono">Manage Emergencies</p>
            </div>
          </Link>
          <Link to="/navigation" className="bg-bg-panel border-2 border-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors px-6 py-4 rounded-md flex items-center gap-3">
            <Map className="w-5 h-5" />
            <div className="text-left">
              <p className="font-bold uppercase tracking-widest text-sm">Crowd Map</p>
              <p className="text-xs opacity-80 font-mono">Live Navigation</p>
            </div>
          </Link>

          <Link to="/admin/provision-volunteer" className="bg-bg-panel border-2 border-accent-primary hover:bg-accent-primary hover:text-white transition-colors px-6 py-4 rounded-md flex items-center gap-3">
            <UserPlus className="w-5 h-5" />
            <div className="text-left">
              <p className="font-bold uppercase tracking-widest text-sm">Provision Volunteer</p>
              <p className="text-xs opacity-80 font-mono">Add Responders</p>
            </div>
          </Link>

          <Link to="/admin/chat" className="bg-bg-panel border-2 border-brand-maroon hover:bg-brand-maroon hover:text-white transition-colors px-6 py-4 rounded-md flex items-center gap-3">
            <MessageSquare className="w-5 h-5" />
            <div className="text-left">
              <p className="font-bold uppercase tracking-widest text-sm">Zone Comms</p>
              <p className="text-xs opacity-80 font-mono">Chat with Volunteers</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
