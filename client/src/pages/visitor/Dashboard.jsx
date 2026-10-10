import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import DigitalIdCard from '../../components/family/DigitalIdCard';
import { PlusCircle, Loader2, MapPin, ShieldAlert } from 'lucide-react';

export default function VisitorDashboard() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const res = await api.get('/api/family-members');
        setMembers(res.data.familyMembers);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load family members');
      } finally {
        setLoading(false);
      }
    };
    fetchFamily();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-maroon" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Action Banners - responsive 2-col on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-status-sos/10 border-2 border-status-sos/30 rounded-lg p-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-status-sos flex items-center gap-2 text-sm sm:text-base">
              <ShieldAlert className="w-5 h-5" />
              EMERGENCY ASSISTANCE
            </h2>
            <p className="text-sm text-text-muted mt-1">Need immediate medical or security help?</p>
          </div>
          <Link to="/visitor/sos" className="shrink-0">
            <Button className="bg-status-sos hover:bg-red-700 text-white font-bold tracking-widest uppercase text-xs h-12 px-6">
              Trigger SOS
            </Button>
          </Link>
        </div>

        <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-lg p-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-emerald-700 flex items-center gap-2 text-sm sm:text-base">
              <MapPin className="w-5 h-5" />
              LIVE CROWD MAP
            </h2>
            <p className="text-sm text-text-muted mt-1">Check crowd density and navigate to facilities.</p>
          </div>
          <Link to="/navigation" className="shrink-0">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-widest uppercase text-xs h-12 px-6">
              Open Map
            </Button>
          </Link>
        </div>
      </div>

      {/* Family Members Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-color pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-brand-maroon tracking-tight">Family Members</h1>
          <p className="text-sm text-text-muted mt-1">Manage digital IDs for your group.</p>
        </div>
        <Link to="/visitor/add-member">
          <Button className="w-full sm:w-auto gap-2">
            <PlusCircle className="w-4 h-4" />
            Add Member
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-status-sos/10 border border-status-sos/20 text-status-sos rounded-md text-sm">
          {error}
        </div>
      )}

      {members.length === 0 && !error ? (
        <div className="text-center py-12 px-4 bg-bg-panel border border-dashed border-border-color rounded-lg max-w-lg mx-auto">
          <h3 className="text-lg font-serif text-brand-maroon mb-2">No members registered</h3>
          <p className="text-sm text-text-muted mb-6">
            Register your family members to generate their digital safety QR codes.
          </p>
          <Link to="/visitor/add-member">
            <Button variant="secondary">Register First Member</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {members.map(member => (
            <div key={member._id} className="relative flex flex-col group">
              <DigitalIdCard member={member} />
              <div className="mt-2 text-center">
                <Link to={`/visitor/raise-case/${member._id}`}>
                  <Button variant="outline" size="sm" className="w-full bg-white border-status-sos text-status-sos hover:bg-status-sos hover:text-white transition-colors uppercase tracking-widest font-bold text-[10px]">
                    Report Missing
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
