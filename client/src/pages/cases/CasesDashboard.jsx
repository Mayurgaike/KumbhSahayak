import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, AlertCircle, CheckCircle, Search, MapPin, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CasesDashboard() {
  const { user } = useAuthStore();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const backLink = isAdmin ? '/admin' : '/volunteer';

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await api.get('/api/lost-person-cases');
        setCases(res.data.cases);
      } catch (err) {
        setError('Failed to fetch active cases.');
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const handleConfirmFound = async (caseId) => {
    try {
      await api.patch(`/api/lost-person-cases/${caseId}`);
      setCases(prev => prev.filter(c => c._id !== caseId));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update case.');
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
      <div className="flex items-start gap-4 border-b border-border-color pb-4">
        <Link to={backLink}>
          <Button variant="ghost" size="icon" className="shrink-0 text-text-muted hover:text-text-primary mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className={cn("text-2xl font-bold tracking-tight", isAdmin ? "text-text-primary" : "text-brand-maroon font-serif")}>
              Lost Person Cases
            </h1>
            <p className="text-sm text-text-muted mt-1 font-mono">
              {isAdmin ? "ACTIVE AI SEARCH QUERIES" : "Active alerts in the network"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-status-sos/10 text-status-sos px-3 py-1.5 rounded border border-status-sos/20">
            <div className="w-2 h-2 rounded-full bg-status-sos animate-pulse"></div>
            {cases.length} ACTIVE
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-sos/10 text-status-sos rounded-md text-sm border border-status-sos/20">
          {error}
        </div>
      )}

      {cases.length === 0 ? (
        <div className={cn("p-12 text-center rounded border border-dashed border-border-color", isAdmin ? "bg-bg-panel/50" : "bg-white")}>
          <CheckCircle className="w-12 h-12 text-status-success mx-auto mb-3 opacity-50" />
          <p className="text-text-muted font-mono uppercase tracking-wider text-sm">No Active Cases</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cases.map((c) => (
            <Card key={c._id} className={cn(
              "border-2 overflow-hidden flex flex-col",
              isAdmin ? "bg-bg-panel border-status-sos shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-white border-status-sos/50"
            )}>
              <div className="bg-status-sos text-white text-xs font-bold uppercase tracking-widest px-4 py-2 flex justify-between items-center">
                <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> MISSING PERSON</span>
                <span>ID: {c._id.slice(-6)}</span>
              </div>
              
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="flex border-b border-border-color">
                  <div className="w-1/3 bg-gray-100 shrink-0 relative min-h-[120px]">
                    {c.referenceImage ? (
                      <img src={c.referenceImage} alt="Reference" className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <div className="w-full h-full absolute inset-0 flex items-center justify-center text-text-muted bg-bg-base text-sm text-center px-2">
                        No Photo
                      </div>
                    )}
                  </div>
                  <div className="w-2/3 p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg leading-tight text-text-primary">{c.familyMemberId?.name}</h3>
                      <p className="text-sm text-text-muted">Age: {c.familyMemberId?.age}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Guardian Contact</p>
                      <p className="text-sm font-mono text-text-primary">{c.familyMemberId?.guardianContact || c.raisedBy?.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-bg-base/50 flex-1">
                  {c.matchedZone ? (
                    <div className="bg-status-high/10 border border-status-high/30 p-3 rounded text-status-high">
                      <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Search className="w-3 h-3" /> AI Match Found!
                      </p>
                      <p className="text-sm flex items-start gap-1 font-medium">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        Spotted in {c.matchedZone?.name || c.matchedZone}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-text-muted mb-2" />
                      <p className="text-xs text-text-muted font-mono uppercase">AI Search in Progress...</p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-border-color mt-auto">
                  <Button 
                    onClick={() => handleConfirmFound(c._id)}
                    className="w-full bg-status-success hover:bg-green-700 text-white font-bold tracking-wider uppercase text-xs"
                  >
                    Confirm Person Found
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
