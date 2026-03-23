import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Smartphone,
  Terminal,
  HardDrive,
  FileCode,
  History,
  LogOut,
  Menu,
  X,
  Ticket,
  User,
  BookOpen,
  Activity
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Active Devices', path: '/dashboard/devices' },
  { icon: Ticket, label: 'Active Tickets', path: '/dashboard/tickets' },
  { icon: Smartphone, label: 'Device Specs', path: '/dashboard/specs' },
  { icon: Terminal, label: 'Terminal Console', path: '/dashboard/terminal' },
  { icon: HardDrive, label: 'Partition Health', path: '/dashboard/partition' },
  { icon: Activity, label: 'Device Health', path: '/technician/device-health' },
  { icon: FileCode, label: 'Firmware Library', path: '/dashboard/firmware' },
  { icon: Terminal, label: 'Logcat Viewer', path: '/dashboard/logs' },
  { icon: History, label: 'Repair History', path: '/dashboard/history' },
  { icon: BookOpen, label: 'Knowledge Base', path: '/technician/knowledge-base' }
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg bg-slate-800 p-2 text-white"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700 bg-slate-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform lg:translate-x-0`}>
        <div className="flex h-full flex-col">
          <div className="shrink-0 p-6">
            <h1 className="text-2xl font-bold text-blue-400">RADS</h1>
            <p className="text-xs text-slate-400">Remote Android Repair Suite</p>
          </div>

          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-300 transition-colors hover:bg-slate-700"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="shrink-0 border-t border-slate-700 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                <User className="text-white" size={20} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user?.name || 'Technician'}</p>
                <p className="text-xs text-blue-400">Technician</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-red-400 transition-colors hover:bg-slate-700"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <div className="p-6 pt-16 lg:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

