import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HelpCircle, 
  Cable, 
  Activity, 
  MessageSquare, 
  LogOut,
  Menu,
  X,
  Smartphone,
  Ticket,
  User,
  UserCircle
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { icon: HelpCircle, label: 'Support Request', path: '/customer/support' },
  { icon: Ticket, label: 'My Tickets', path: '/customer/tickets' },
  { icon: Cable, label: 'Connection Wizard', path: '/customer/wizard' },
  { icon: Activity, label: 'Live Status', path: '/customer/status' },
  { icon: MessageSquare, label: 'Feedback', path: '/customer/feedback' },
  { icon: UserCircle, label: 'My Profile', path: '/customer/profile' },
];

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
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
          <div className="flex items-center gap-3">
            <Smartphone className="text-blue-400" size={28} />
            <div>
              <h1 className="text-xl font-bold text-blue-400">RADS</h1>
              <p className="text-xs text-slate-400">Customer Portal</p>
            </div>
          </div>
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
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name || 'Customer'}</p>
              <p className="text-xs text-slate-400">Customer</p>
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

