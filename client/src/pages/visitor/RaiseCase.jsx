import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft, Loader2, Upload, AlertTriangle } from 'lucide-react';

export default function RaiseCase() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Optional new photo
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    // We don't have a GET /api/family-members/:id route strictly defined in earlier steps, 
    // so we'll fetch all and filter.
    const fetchMember = async () => {
      try {
        const res = await api.get('/api/family-members');
        const found = res.data.familyMembers.find(m => m._id === memberId);
        if (found) {
          setMember(found);
        } else {
          setError('Family member not found.');
        }
      } catch (err) {
        setError('Failed to fetch family member.');
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [memberId]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('familyMemberId', memberId);
      if (photo) {
        formData.append('photo', photo);
      }

      await api.post('/api/lost-person-cases', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Navigate back to visitor dashboard where they will see the active case
      navigate('/visitor');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to raise case. Please try again.');
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

  if (!member) {
    return (
      <div className="max-w-xl mx-auto mt-8 p-4 text-center">
        <p className="text-status-sos">{error}</p>
        <Link to="/visitor">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-8">
      <div className="flex items-center gap-4 pb-4">
        <Link to="/visitor">
          <Button variant="ghost" size="icon" className="shrink-0 text-text-muted hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-brand-maroon tracking-tight">Report Lost Person</h1>
          <p className="text-sm text-text-muted mt-1">Activate AI face matching for {member.name}.</p>
        </div>
      </div>

      <Card className="bg-bg-panel border-status-sos shadow-sm">
        <div className="bg-status-sos/10 px-6 py-3 border-b border-status-sos/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-status-sos" />
          <p className="text-sm font-bold text-status-sos">EMERGENCY ALERT</p>
        </div>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm bg-status-sos/10 text-status-sos border border-status-sos/20 rounded font-medium">
                {error}
              </div>
            )}

            <div className="bg-bg-base p-4 rounded-md border border-border-color flex gap-4 items-center">
              {member.photoUrl ? (
                <img src={member.photoUrl} alt={member.name} className="w-16 h-16 rounded-full object-cover border border-border-color" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 border border-border-color flex items-center justify-center text-gray-400">
                  No Photo
                </div>
              )}
              <div>
                <p className="font-bold text-text-primary">{member.name}</p>
                <p className="text-sm text-text-muted">Age: {member.age}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold tracking-wide text-text-primary">
                Update Photo (Highly Recommended)
              </label>
              <p className="text-xs text-text-muted">
                If they are wearing different clothes today or you have a clearer photo, upload it now to help the AI cameras find them faster.
              </p>
              
              <div className="mt-2 flex items-center gap-4 relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded object-cover border-2 border-accent-gold" />
                ) : (
                  <div className="w-20 h-20 rounded bg-bg-base border-2 border-dashed border-border-color flex flex-col items-center justify-center text-text-muted hover:border-accent-primary transition-colors">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Upload</span>
                  </div>
                )}
                
                {/* Invisible file input covering the area */}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange}
                  className="absolute inset-0 w-20 h-20 opacity-0 cursor-pointer"
                />
                
                {photoPreview && (
                  <Button type="button" variant="outline" size="sm" onClick={() => { setPhoto(null); setPhotoPreview(null); }}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={submitting} 
              className="w-full bg-status-sos hover:bg-red-700 text-white font-bold py-6 text-lg mt-4"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Activating AI Search...</>
              ) : (
                'Report Missing & Start Search'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
