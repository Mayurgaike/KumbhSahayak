import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';

export default function AddFamilyMember() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    guardianContact: '',
    address: '',
    passphrase: ''
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (photo) {
      data.append('photo', photo);
    }

    try {
      await api.post('/api/family-members', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate('/visitor');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to register family member');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-border-color pb-4">
        <Link to="/visitor">
          <Button variant="ghost" size="icon" className="shrink-0 text-text-muted hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-brand-maroon tracking-tight">Register Family Member</h1>
          <p className="text-sm text-text-muted mt-1">Generate a digital safety QR token instantly.</p>
        </div>
      </div>

      <Card className="bg-bg-panel border-border-color shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-white bg-status-sos rounded font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Full Name <span className="text-status-sos">*</span></label>
              <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Age <span className="text-status-sos">*</span></label>
                <Input type="number" name="age" value={formData.age} onChange={handleChange} min="0" className="tabular-nums" required />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Guardian Contact <span className="text-status-sos">*</span></label>
                <Input type="tel" name="guardianContact" value={formData.guardianContact} onChange={handleChange} placeholder="+91..." className="tabular-nums" required minLength={10} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Address / City <span className="text-status-sos">*</span></label>
              <Input name="address" value={formData.address} onChange={handleChange} placeholder="e.g. Pune, Maharashtra" required minLength={5} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Safety Passphrase <span className="text-status-sos">*</span></label>
              <Input name="passphrase" value={formData.passphrase} onChange={handleChange} placeholder="A secret word for volunteers to verify" required minLength={4} />
              <p className="text-xs text-text-muted mt-1">Volunteers will ask the child for this word if found.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Photo (Optional)</label>
              <div className="relative border border-dashed border-border-color rounded-lg p-4 bg-bg-base flex flex-col items-center justify-center gap-2">
                <Upload className="w-6 h-6 text-text-muted" />
                <span className="text-sm text-text-muted">
                  {photo ? photo.name : "Tap to upload photo"}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setPhoto(e.target.files[0])}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Token...
                </>
              ) : 'Register & Generate QR'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
