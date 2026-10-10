import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Loader2, AlertCircle, Search, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export default function VolunteerTasks() {
  const [tasks, setTasks] = useState({ sosCases: [], lostPersonCases: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/api/volunteers/tasks');
        setTasks(res.data);
      } catch (err) {
        setError('Failed to fetch tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  const totalTasks = tasks.sosCases.length + tasks.lostPersonCases.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-start gap-4 border-b border-border-color pb-4">
        <Link to="/volunteer">
          <Button variant="ghost" size="icon" className="shrink-0 text-text-muted hover:text-text-primary mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-maroon">My Active Tasks</h1>
            <p className="text-sm text-text-muted mt-1 font-mono">YOUR ZONE ASSIGNMENTS</p>
          </div>
          <div className="bg-accent-primary/10 text-accent-primary font-bold px-3 py-1 rounded">
            {totalTasks} ACTIVE
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-sos/10 text-status-sos rounded-md text-sm border border-status-sos/20">
          {error}
        </div>
      )}

      {totalTasks === 0 ? (
        <div className="p-12 text-center rounded border border-dashed border-border-color bg-white">
          <CheckCircle className="w-12 h-12 text-status-success mx-auto mb-3 opacity-50" />
          <p className="text-text-muted font-mono uppercase tracking-wider text-sm">No Active Tasks</p>
          <p className="text-xs text-text-muted mt-2">Stand by for command center dispatch.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SOS Tasks */}
          {tasks.sosCases.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-status-sos" /> Assigned Emergencies
              </h2>
              {tasks.sosCases.map(sos => (
                <Card key={sos._id} className="border-2 border-status-sos/50">
                  <div className="bg-status-sos text-white text-xs font-bold uppercase tracking-widest px-4 py-2 flex justify-between">
                    <span>{sos.type}</span>
                    <span>{new Date(sos.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <CardContent className="p-4">
                    <p className="font-bold">{sos.zoneId?.name || sos.zoneId}</p>
                    <p className="text-sm text-text-muted mt-1">Reported by: {sos.raisedBy?.name}</p>
                    <Link to="/volunteer/sos">
                      <Button className="w-full mt-4 bg-status-sos hover:bg-red-700 text-white font-bold">
                        Manage in SOS Dispatch
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Lost Person Tasks */}
          {tasks.lostPersonCases.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Search className="w-5 h-5 text-accent-gold" /> Lost Persons in Zone
              </h2>
              {tasks.lostPersonCases.map(c => (
                <Card key={c._id} className="border-2 border-accent-gold/50">
                  <div className="bg-accent-gold text-black text-xs font-bold uppercase tracking-widest px-4 py-2 flex justify-between">
                    <span>AI MATCH FOUND</span>
                    <span>{new Date(c.matchedAt).toLocaleTimeString()}</span>
                  </div>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 shrink-0">
                      {c.familyMemberId?.referenceImage ? (
                        <img src={c.familyMemberId.referenceImage} alt="Ref" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-text-muted bg-gray-200">No Image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">{c.familyMemberId?.name}</p>
                      <p className="text-sm text-text-muted">Age: {c.familyMemberId?.age} • Gender: {c.familyMemberId?.gender}</p>
                      <Link to="/volunteer/cases">
                        <Button variant="outline" size="sm" className="w-full mt-2 border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-black font-bold">
                          View in Cases
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
