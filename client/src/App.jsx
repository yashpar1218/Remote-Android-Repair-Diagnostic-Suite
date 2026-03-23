import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import DashboardLayout from './layouts/DashboardLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CustomerLogin from './pages/auth/CustomerLogin';
import CustomerRegister from './pages/auth/CustomerRegister';

import ActiveDevices from './pages/technician/ActiveDevices';
import DeviceSpecs from './pages/technician/DeviceSpecs';
import TerminalConsole from './pages/technician/TerminalConsole';
import PartitionHealth from './pages/technician/PartitionHealth';
import FirmwareLibrary from './pages/technician/FirmwareLibrary';
import LogcatViewer from './pages/technician/LogcatViewer';
import RepairHistory from './pages/technician/RepairHistory';
import ActiveTickets from './pages/technician/ActiveTickets';
import DeviceHealth from './pages/technician/DeviceHealth';
import KnowledgeBase from './pages/technician/KnowledgeBase';
import KnowledgeArticleDetail from './pages/technician/KnowledgeArticleDetail';

import SupportRequest from './pages/customer/SupportRequest';
import MyTickets from './pages/customer/MyTickets';
import PaymentPage from './pages/customer/PaymentPage';
import ConnectionWizard from './pages/customer/ConnectionWizard';
import LiveStatus from './pages/customer/LiveStatus';
import Feedback from './pages/customer/Feedback';
import Profile from './pages/customer/Profile';

import UserManagement from './pages/admin/UserManagement';
import AuditLogs from './pages/admin/AuditLogs';
import Analytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports';
import ManageTickets from './pages/admin/ManageTickets';

import { AuthProvider } from './context/AuthContext';
import { AdminRoute, TechnicianRoute, CustomerRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/register" element={<CustomerRegister />} />

          <Route
            path="/customer"
            element={
              <CustomerRoute>
                <CustomerLayout />
              </CustomerRoute>
            }
          >
            <Route index element={<Navigate to="/customer/support" replace />} />
            <Route path="support" element={<SupportRequest />} />
            <Route path="tickets" element={<MyTickets />} />
            <Route path="payment/:ticketId" element={<PaymentPage />} />
            <Route path="wizard" element={<ConnectionWizard />} />
            <Route path="wizard/:ticketId" element={<ConnectionWizard />} />
            <Route path="status" element={<LiveStatus />} />
            <Route path="status/:ticketId" element={<LiveStatus />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <TechnicianRoute>
                <DashboardLayout />
              </TechnicianRoute>
            }
          >
            <Route index element={<ActiveDevices />} />
            <Route path="devices" element={<ActiveDevices />} />
            <Route path="device/:deviceId" element={<DeviceSpecs />} />
            <Route path="specs" element={<DeviceSpecs />} />
            <Route path="specs/:deviceId" element={<DeviceSpecs />} />
            <Route path="terminal/:deviceId" element={<TerminalConsole />} />
            <Route path="terminal" element={<TerminalConsole />} />
            <Route path="partition" element={<PartitionHealth />} />
            <Route path="partition/:deviceId" element={<PartitionHealth />} />
            <Route path="firmware" element={<FirmwareLibrary />} />
            <Route path="logs" element={<LogcatViewer />} />
            <Route path="logs/:deviceId" element={<LogcatViewer />} />
            <Route path="history" element={<RepairHistory />} />
            <Route path="tickets" element={<ActiveTickets />} />
            <Route path="device-health" element={<DeviceHealth />} />
            <Route path="device-health/:deviceId" element={<DeviceHealth />} />
            <Route path="knowledge" element={<Navigate to="/technician/knowledge-base" replace />} />
          </Route>

          <Route
            path="/technician"
            element={
              <TechnicianRoute>
                <DashboardLayout />
              </TechnicianRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard/devices" replace />} />
            <Route path="device-health" element={<DeviceHealth />} />
            <Route path="device-health/:deviceId" element={<DeviceHealth />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="knowledge-base/:id" element={<KnowledgeArticleDetail />} />
          </Route>

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="tickets" element={<ManageTickets />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;



