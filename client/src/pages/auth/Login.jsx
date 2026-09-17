import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export default function Login({ isAdmin = false }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/api/auth/login', { phone, password });
      login(res.data.user, res.data.accessToken);
      
      if (res.data.user.role === 'visitor') {
        navigate('/visitor');
      } else if (res.data.user.role === 'volunteer') {
        navigate('/volunteer');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Brand Wordmark (using display serif) */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl tracking-tight">Kumbh Sahayak</h1>
        <p className="text-text-muted mt-2 font-medium">
          {isAdmin ? 'Admin Console' : 'Safe. Secure. Together.'}
        </p>
      </div>

      <Card className="w-full max-w-md bg-bg-panel shadow-md border-border-color">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-center">
            {isAdmin ? 'System Login' : 'Sign In'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-white bg-status-sos rounded font-medium">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Phone Number</label>
              <Input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="+91..." 
                className="tabular-nums"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" className="w-full mt-2 font-semibold">
              {isAdmin ? 'Authenticate' : 'Sign In'}
            </Button>
            
            {!isAdmin && (
              <div className="text-center pt-2">
                <a href="/register" className="text-sm font-medium text-accent-primary hover:text-accent-gold-hover transition-colors">
                  New visitor? Register here
                </a>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
