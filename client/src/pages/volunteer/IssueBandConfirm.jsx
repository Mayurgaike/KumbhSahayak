import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function IssueBandConfirm() {
  const { qrCode } = useParams();
  const navigate = useNavigate();
  
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await api.get(`/api/family-members/qr/${encodeURIComponent(qrCode)}`);
        setMember(res.data.familyMember);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to read QR token.');
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [qrCode]);

  const handleIssue = async () => {
    if (!member) return;
    setIssuing(true);
    setError(null);
    try {
      await api.post(`/api/family-members/${member._id}/issue-band`);
      setSuccess(true);
      // Update local state to reflect success
      setMember(prev => ({ ...prev, physicalBandIssued: true }));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to issue wristband.');
    } finally {
      setIssuing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto px-4 mt-6">
      <div className="flex items-center gap-4 pb-4">
        <Link to="/volunteer/issue-band/scan">
          <Button variant="ghost" size="icon" className="shrink-0 text-text-muted hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-brand-maroon tracking-tight">Confirm Issuance</h1>
          <p className="text-sm text-text-muted mt-1">Verify details before handing over band.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-sos/10 border border-status-sos/20 text-status-sos rounded-md text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-status-success/10 border border-status-success/20 text-status-success rounded-md text-sm font-medium flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5" />
          Physical wristband successfully issued!
        </div>
      )}

      {member && (
        <Card className="bg-bg-panel border-border-color shadow-sm">
          <CardContent className="p-6">
            {member.photoUrl && (
              <div className="flex justify-center mb-6">
                <img src={member.photoUrl} alt="Child" className="w-24 h-24 object-cover rounded-full border-4 border-bg-base shadow-sm" />
              </div>
            )}
            
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-serif text-brand-maroon">{member.name}</h2>
              <p className="text-lg text-text-primary">Age: <span className="font-semibold tabular-nums">{member.age}</span></p>
            </div>

            {member.physicalBandIssued ? (
              <div className="bg-bg-base rounded-md p-4 text-center border border-border-color">
                <CheckCircle className="w-8 h-8 text-status-low mx-auto mb-2" />
                <p className="text-sm font-bold text-text-primary">Wristband Already Issued</p>
                <p className="text-xs text-text-muted mt-1">This person already has an active band on record.</p>
              </div>
            ) : (
              <Button 
                onClick={handleIssue} 
                disabled={issuing} 
                className="w-full bg-status-low hover:bg-status-low text-white font-semibold py-6 text-lg"
              >
                {issuing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Issuing...</>
                ) : (
                  'Mark Band as Issued'
                )}
              </Button>
            )}
            
            {success && (
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/volunteer')}>
                Return to Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
