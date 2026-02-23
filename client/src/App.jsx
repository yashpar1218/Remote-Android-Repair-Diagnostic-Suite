import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Technician Dashboard (8 Forms)
import ActiveDevices from './pages/technician/ActiveDevices';
import DeviceSpecs from './pages/technician/DeviceSpecs';
import TerminalConsole from './pages/technician/TerminalConsole';
import PartitionHealth from './pages/technician/PartitionHealth';
import FirmwareLibrary from './pages/technician/FirmwareLibrary';
import LogcatViewer from './pages/technician/LogcatViewer';
import RepairHistory from './pages/technician/RepairHistory';

// Customer Portal (4 Forms)
import SupportRequest from './pages/customer/SupportRequest';
import ConnectionWizard from './pages/customer/ConnectionWizard';
import LiveStatus from './pages/customer/LiveStatus';
import Feedback from './pages/customer/Feedback';

// Admin (4 Forms)
import UserManagement from './pages/admin/UserManagement';
import KnowledgeBase from './pages/admin/KnowledgeBase';
import AuditLogs from './pages/admin/AuditLogs';
import Analytics from './pages/admin/Analytics';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Customer Portal */}
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<Navigate to="/customer/support" replace />} />
            <Route path="support" element={<SupportRequest />} />
            <Route path="wizard" element={<ConnectionWizard />} />
            <Route path="status" element={<LiveStatus />} />
            <Route path="feedback" element={<Feedback />} />
          </Route>

          {/* Technician Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<ActiveDevices />} />
            <Route path="devices" element={<ActiveDevices />} />
            <Route path="device/:deviceId" element={<DeviceSpecs />} />
            <Route path="terminal/:deviceId" element={<TerminalConsole />} />
            <Route path="partition/:deviceId" element={<PartitionHealth />} />
            <Route path="firmware" element={<FirmwareLibrary />} />
            <Route path="logs/:deviceId" element={<LogcatViewer />} />
            <Route path="history" element={<RepairHistory />} />
          </Route>

          {/* Admin Panel */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
