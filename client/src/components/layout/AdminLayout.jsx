import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { LogOut, Home } from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-bg-panel/95 backdrop-blur border-b border-border-color">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 group">
            <span className="text-lg font-serif text-accent-gold font-bold tracking-tight group-hover:opacity-80 transition-opacity">
              Kumbh Sahayak
            </span>
            <span className="text-[10px] font-mono bg-accent-gold/20 text-accent-gold px-2 py-0.5 rounded uppercase tracking-widest hidden sm:inline">
              Command Center
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-2 rounded-lg hover:bg-border-color/30 transition-colors text-text-muted hover:text-text-primary" title="Home">
              <Home className="w-5 h-5" />
            </Link>
            <span className="text-xs text-text-muted font-mono hidden sm:block">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-status-sos/20 text-text-muted hover:text-status-sos transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
