import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { LogOut, Home } from 'lucide-react';

export default function VisitorLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isVolunteer = user?.role === 'volunteer';
  const homeLink = isVolunteer ? '/volunteer' : '/visitor';

  return (
    <div className="theme-visitor min-h-screen bg-bg-base text-text-primary">
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-bg-panel/95 backdrop-blur border-b border-border-color">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to={homeLink} className="flex items-center gap-2 group">
            <span className="text-lg font-serif text-brand-maroon font-bold tracking-tight group-hover:opacity-80 transition-opacity">
              Kumbh Sahayak
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to={homeLink} className="p-2 rounded-lg hover:bg-bg-base transition-colors text-text-muted hover:text-text-primary" title="Home">
              <Home className="w-5 h-5" />
            </Link>
            <span className="text-xs text-text-muted font-mono hidden sm:block">
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 text-text-muted hover:text-status-sos transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
