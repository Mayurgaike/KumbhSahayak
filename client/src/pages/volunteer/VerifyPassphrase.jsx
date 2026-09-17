import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { ArrowLeft, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function VerifyPassphrase() {
  const { qrCode } = useParams();
  const navigate = useNavigate();
  
  const [expectedPassphrase, setExpectedPassphrase] = useState(null);
  const [inputPassphrase, setInputPassphrase] = useState('');
  const [piiData, setPiiData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPassphrase = async () => {
      try {
        const res = await api.get(`/api/scan/${encodeURIComponent(qrCode)}`);
        setExpectedPassphrase(res.data.passphrase);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Invalid or expired QR code.');
      } finally {
        setLoading(false);
      }
    };
    fetchPassphrase();
  }, [qrCode]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    try {
      // In a real app we might grab real GPS coords. For MVP, pass a string.
      const location = "Kumbh Mela Sector 4 Checkpoint";
      
      const res = await api.post(`/api/scan/${encodeURIComponent(qrCode)}/verify`, {
        passphrase: inputPassphrase,
        location
      });
      setPiiData(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Verification failed. Incorrect passphrase.');
    } finally {
      setVerifying(false);
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
        <Link to="/volunteer/scan">
          <Button variant="ghost" size="icon" className="shrink-0 text-text-muted hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-brand-maroon tracking-tight">Trust but Verify</h1>
          <p className="text-sm text-text-muted mt-1">PII is locked behind safety checks.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-sos/10 border border-status-sos/20 text-status-sos rounded-md text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {piiData ? (
        <Card className="bg-bg-panel border-status-success/50 shadow-md">
          <CardHeader className="bg-status-success/10 border-b border-status-success/20 pb-4">
            <CardTitle className="text-xl flex items-center gap-2 text-status-success">
              <ShieldCheck className="w-6 h-6" />
              Identity Verified
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {piiData.photoUrl && (
              <div className="flex justify-center mb-6">
                <img src={piiData.photoUrl} alt="Child" className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-sm" />
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Child's Name</p>
              <p className="text-lg font-medium text-text-primary">{piiData.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Guardian Contact</p>
              <p className="text-lg font-medium text-text-primary tabular-nums">{piiData.guardianContact}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Address</p>
              <p className="text-base text-text-primary">{piiData.address}</p>
            </div>
            
            <a href={`tel:${piiData.guardianContact}`} className="block mt-6">
              <Button className="w-full">Call Guardian Now</Button>
            </a>
          </CardContent>
        </Card>
      ) : expectedPassphrase ? (
        <Card className="bg-bg-panel border-border-color shadow-sm">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-text-muted mb-2">Ask the child:</p>
              <p className="text-lg font-serif text-brand-maroon">"What is your secret word?"</p>
            </div>
            
            <div className="bg-accent-gold/10 border border-accent-gold/20 p-4 rounded-md text-center mb-6">
              <p className="text-xs uppercase tracking-wider font-bold text-accent-gold mb-1">Expected Answer</p>
              <p className="text-2xl font-mono tracking-widest text-text-primary">{expectedPassphrase}</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide uppercase text-text-muted">Confirm Passphrase</label>
                <Input 
                  value={inputPassphrase} 
                  onChange={(e) => setInputPassphrase(e.target.value)} 
                  placeholder="Type the word here..." 
                  required 
                />
              </div>
              <Button type="submit" className="w-full font-semibold bg-accent-gold hover:bg-accent-gold-hover text-white" disabled={verifying}>
                {verifying ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : 'Verify & Reveal Info'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
