import React from 'react';
import { Outlet } from 'react-router-dom';

export default function VisitorLayout() {
  return (
    <div className="theme-visitor min-h-screen bg-bg-base text-text-primary">
      {/* Mobile-first topnav can go here */}
      <main className="p-4 sm:p-6 max-w-md mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
