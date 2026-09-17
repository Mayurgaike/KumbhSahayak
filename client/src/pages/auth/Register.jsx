import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    address: ''
  });
  const [error, setError] = useState(null);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/api/auth/register', formData);
      login(res.data.user, res.data.accessToken);
      navigate('/visitor');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Brand Wordmark */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl tracking-tight">Kumbh Sahayak</h1>
        <p className="text-text-muted mt-2 font-medium">Safe. Secure. Together.</p>
      </div>

      <Card className="w-full max-w-md bg-bg-panel shadow-md border-border-color">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-center">Visitor Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-white bg-status-sos rounded font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Full Name</label>
              <Input 
                name="name"
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Phone Number</label>
              <Input 
                type="tel" 
                name="phone"
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="+91..." 
                className="tabular-nums"
                required 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Password</label>
              <Input 
                type="password" 
                name="password"
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wide uppercase text-accent-primary">Address</label>
              <Input 
                name="address"
                value={formData.address} 
                onChange={handleChange} 
              />
            </div>
            
            <Button type="submit" className="w-full mt-2 font-semibold">Register</Button>
            
            <div className="text-center pt-2">
              <a href="/login" className="text-sm font-medium text-accent-primary hover:text-accent-gold-hover transition-colors">
                Already have an account? Sign In
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
