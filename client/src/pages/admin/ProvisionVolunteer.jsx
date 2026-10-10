import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, ShieldCheck, UserPlus, Phone, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProvisionVolunteer() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    zoneId: ''
  });

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await api.get('/api/zones/public/status');
        setZones(res.data.zones || []);
      } catch (err) {
        console.error('Failed to fetch zones', err);
      } finally {
        setLoading(false);
      }
    };
    fetchZones();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    try {
      const res = await api.post('/api/volunteers', formData);
      setSuccess(`Volunteer ${res.data.volunteer.name} provisioned successfully!`);
      setFormData({ name: '', phone: '', password: '', zoneId: '' });
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to provision volunteer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 text-text-primary">
      <div className="flex items-start gap-4 border-b border-border-color pb-4">
        <Link to="/admin">
          <Button variant="ghost" size="icon" className="shrink-0 text-text-muted hover:text-text-primary mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Provision Volunteer</h1>
            <p className="text-sm text-text-muted mt-1 font-mono">ONBOARD FIELD RESPONDERS</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-status-success/20 border border-status-success text-status-success p-4 rounded flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          {success}
        </div>
      )}

      <Card className="bg-bg-panel border-border-color">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-accent-gold" /> Add New Volunteer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold tracking-wider opacity-70">Full Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-bg-base border border-border-color rounded px-3 py-2 text-white focus:border-accent-gold outline-none"
                placeholder="Ravi Kumar"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-bold tracking-wider opacity-70">Phone Number (with country code)</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 opacity-50" />
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-bg-base border border-border-color rounded px-3 py-2 pl-9 text-white focus:border-accent-gold outline-none"
                  placeholder="+919876543210"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-bold tracking-wider opacity-70">Initial Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 opacity-50" />
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-bg-base border border-border-color rounded px-3 py-2 pl-9 text-white focus:border-accent-gold outline-none"
                  placeholder="Set initial password"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase font-bold tracking-wider opacity-70">Assign to Zone</label>
              <select
                required
                value={formData.zoneId}
                onChange={(e) => setFormData({...formData, zoneId: e.target.value})}
                className="w-full bg-bg-base border border-border-color rounded px-3 py-2 text-white focus:border-accent-gold outline-none"
              >
                <option value="" disabled>-- Select Zone --</option>
                {zones.map(z => (
                  <option key={z._id} value={z._id}>{z.name}</option>
                ))}
              </select>
            </div>

            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-accent-gold hover:bg-yellow-600 text-black font-bold uppercase tracking-widest mt-4"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "PROVISION ACCOUNT"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
