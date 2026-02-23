import { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download,
  Filter,
  User,
  Terminal,
  Shield,
  AlertTriangle,
  Clock,
  ChevronDown
} from 'lucide-react';

// Mock audit logs
const mockLogs = [
  { 
    id: '1', 
    timestamp: '2024-02-16 14:30:25',
    user: 'John Doe',
    action: 'Device Access',
    target: 'Samsung Galaxy S21',
    command: 'adb shell getprop',
    ip: '192.168.1.100',
    status: 'success'
  },
  { 
    id: '2', 
    timestamp: '2024-02-16 14:25:10',
    user: 'Jane Smith',
    action: 'Firmware Flash',
    target: 'OnePlus 9 Pro',
    command: 'fastboot flash system rom.img',
    ip: '192.168.1.101',
    status: 'success'
  },
  { 
    id: '3', 
    timestamp: '2024-02-16 14:20:05',
    user: 'John Doe',
    action: 'Login',
    target: 'System',
    command: '-',
    ip: '192.168.1.100',
    status: 'success'
  },
  { 
    id: '4', 
    timestamp: '2024-02-16 14:15:30',
    user: 'Admin',
    action: 'User Management',
    target: 'User ID: 4',
    command: 'DELETE /api/user/4',
    ip: '192.168.1.50',
    status: 'success'
  },
  { 
    id: '5', 
    timestamp: '2024-02-16 14:10:22',
    user: 'John Doe',
    action: 'Terminal Command',
    target: 'Xiaomi Mi 11',
    command: 'adb reboot recovery',
    ip: '192.168.1.100',
    status: 'warning'
  },
  { 
    id: '6', 
    timestamp: '2024-02-16 14:05:18',
    user: 'Unknown',
    action: 'Login Failed',
    target: 'System',
    command: '-',
    ip: '192.168.1.200',
    status: 'error'
  },
  { 
    id: '7', 
    timestamp: '2024-02-16 14:00:45',
    user: 'Jane Smith',
    action: 'Partition Check',
    target: 'Google Pixel 6',
    command: 'adb shell df -h',
    ip: '192.168.1.101',
    status: 'success'
  },
  { 
    id: '8', 
    timestamp: '2024-02-16 13:55:30',
    user: 'Admin',
    action: 'System Config',
    target: 'Settings',
    command: 'PUT /api/config',
    ip: '192.168.1.50',
    status: 'success'
  },
];

export default function AuditLogs() {
  const [logs] = useState(mockLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter);
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesAction && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('Login')) return <User size={16} />;
    if (action.includes('Terminal') || action.includes('Command')) return <Terminal size={16} />;
    if (action.includes('User') || action.includes('System')) return <Shield size={16} />;
    return <FileText size={16} />;
  };

  const uniqueActions = [...new Set(logs.map(l => l.action.split(' ')[0]))];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400">Track all system activities and commands</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
          <Download size={20} />
          Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Logs</p>
              <p className="text-2xl font-bold text-white">{logs.length}</p>
            </div>
            <FileText className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Successful</p>
              <p className="text-2xl font-bold text-green-400">{logs.filter(l => l.status === 'success').length}</p>
            </div>
            <Shield className="text-green-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Warnings</p>
              <p className="text-2xl font-bold text-yellow-400">{logs.filter(l => l.status === 'warning').length}</p>
            </div>
            <AlertTriangle className="text-yellow-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Errors</p>
              <p className="text-2xl font-bold text-red-400">{logs.filter(l => l.status === 'error').length}</p>
            </div>
            <AlertTriangle className="text-red-400" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="form-card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="form-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Timestamp</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">User</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Action</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Target</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Command</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="text-sm">{log.timestamp}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-white">{log.user}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{getActionIcon(log.action)}</span>
                      <span className="text-slate-300">{log.action}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-300">{log.target}</span>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-blue-400 text-sm">{log.command}</code>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <div className="form-card text-center py-12">
          <FileText className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-400">No logs found</p>
        </div>
      )}
    </div>
  );
}
