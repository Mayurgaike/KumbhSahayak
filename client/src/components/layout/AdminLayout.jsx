import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Sidebar / Topnav can go here */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
