import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import DigitalIdCard from '../../components/family/DigitalIdCard';
import { PlusCircle, Loader2 } from 'lucide-react';

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
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <div className="text-center py-12 px-4 bg-bg-panel border border-dashed border-border-color rounded-lg">
          <h3 className="text-lg font-serif text-brand-maroon mb-2">No members registered</h3>
          <p className="text-sm text-text-muted mb-6">
            Register your family members to generate their digital safety QR codes.
          </p>
          <Link to="/visitor/add-member">
            <Button variant="secondary">Register First Member</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map(member => (
            <DigitalIdCard key={member._id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
