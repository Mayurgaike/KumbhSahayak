import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

import AdminLayout from './components/layout/AdminLayout';
import VisitorLayout from './components/layout/VisitorLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VisitorDashboard from './pages/visitor/Dashboard';
import AddFamilyMember from './pages/visitor/AddFamilyMember';
import VolunteerDashboard from './pages/volunteer/Dashboard';
import ScanQR from './pages/volunteer/ScanQR';
import VerifyPassphrase from './pages/volunteer/VerifyPassphrase';
import IssueBandScan from './pages/volunteer/IssueBandScan';
import IssueBandConfirm from './pages/volunteer/IssueBandConfirm';

import AdminDashboard from './pages/admin/Dashboard';
import LiveStatus from './pages/public/LiveStatus';
import RaiseCase from './pages/visitor/RaiseCase';
import CasesDashboard from './pages/cases/CasesDashboard';
import RaiseSOS from './pages/sos/RaiseSOS';
import SOSDashboard from './pages/sos/SOSDashboard';
import Navigation from './pages/shared/Navigation';
import ProvisionVolunteer from './pages/admin/ProvisionVolunteer';
import VolunteerTasks from './pages/volunteer/VolunteerTasks';
import LiveChat from './pages/shared/LiveChat';

import SocketManager from './components/layout/SocketManager';

// Simple Route Guards
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" />; 
  }
  return <SocketManager>{children}</SocketManager>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes (Visitor Theme) */}
        <Route element={<VisitorLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Public Auth Routes (Admin Theme) */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/login" element={<Login isAdmin={true} />} />
        </Route>

        {/* Public Live Status - No Auth Required */}
        <Route element={<VisitorLayout />}>
          <Route path="/public/status" element={<LiveStatus />} />
        </Route>

        {/* Visitor/Volunteer App */}
        <Route element={
          <ProtectedRoute allowedRoles={['visitor', 'volunteer', 'admin', 'superadmin']}>
            <VisitorLayout />
          </ProtectedRoute>
        }>
          <Route path="/navigation" element={<Navigation />} />
          
          <Route path="/visitor" element={<VisitorDashboard />} />
          <Route path="/visitor/add-member" element={<AddFamilyMember />} />
          <Route path="/visitor/raise-case/:memberId" element={<RaiseCase />} />
          <Route path="/visitor/sos" element={<RaiseSOS />} />
          <Route path="/volunteer" element={<VolunteerDashboard />} />
          <Route path="/volunteer/issue-band/scan" element={<IssueBandScan />} />
          <Route path="/volunteer/issue-band/confirm/:qrCode" element={<IssueBandConfirm />} />
          <Route path="/volunteer/scan" element={<ScanQR />} />
          <Route path="/volunteer/verify/:qrCode" element={<VerifyPassphrase />} />
          <Route path="/volunteer/cases" element={<CasesDashboard />} />
          <Route path="/volunteer/sos" element={<SOSDashboard />} />
          <Route path="/volunteer/sos/raise" element={<RaiseSOS />} />
          <Route path="/volunteer/tasks" element={<VolunteerTasks />} />
          <Route path="/volunteer/chat" element={<LiveChat />} />
        </Route>

        {/* Admin Dashboard */}
        <Route element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/cases" element={<CasesDashboard />} />
          <Route path="/admin/sos" element={<SOSDashboard />} />
          <Route path="/admin/provision-volunteer" element={<ProvisionVolunteer />} />
          <Route path="/admin/chat" element={<LiveChat />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
