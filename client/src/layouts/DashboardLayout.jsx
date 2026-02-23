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
  X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Active Devices', path: '/dashboard/devices' },
  { icon: Smartphone, label: 'Device Specs', path: '/dashboard/devices' },
  { icon: Terminal, label: 'Terminal Console', path: '/dashboard/devices' },
  { icon: HardDrive, label: 'Partition Health', path: '/dashboard/devices' },
  { icon: FileCode, label: 'Firmware Library', path: '/dashboard/firmware' },
  { icon: Terminal, label: 'Logcat Viewer', path: '/dashboard/devices' },
  { icon: History, label: 'Repair History', path: '/dashboard/history' },
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
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-slate-800 rounded-lg text-white"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-800 border-r border-slate-700 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-400">RADS</h1>
          <p className="text-xs text-slate-400">Remote Android Repair Suite</p>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=technician'}
              alt="Profile"
              className="w-10 h-10 rounded-full bg-slate-600"
            />
            <div>
              <p className="text-sm font-medium text-white">{user?.name || 'Technician'}</p>
              <p className="text-xs text-slate-400">Online</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 pt-16 lg:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
