import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Download,
  User,
  Terminal,
  Shield,
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api/audit';

const escapeCsvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = useMemo(() => logs.filter((log) => {
    const haystack = [log.user, log.command, log.target, log.action].join(' ').toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesAction && matchesStatus;
  }), [logs, searchTerm, actionFilter, statusFilter]);

  const uniqueActions = [...new Set(logs.map((log) => log.action).filter(Boolean))].sort();

  const exportLogs = () => {
    if (!filteredLogs.length) return;
    const csv = [
      ['Timestamp', 'User', 'Action', 'Target', 'Command', 'IP', 'Status'].map(escapeCsvCell).join(','),
      ...filteredLogs.map((log) => ([
        formatTimestamp(log.timestamp),
        log.user || '-',
        log.action || '-',
        log.target || '-',
        log.command || '-',
        log.ip || '-',
        log.status || '-'
      ].map(escapeCsvCell).join(',')))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getActionIcon = (action = '') => {
    if (action.includes('Login')) return <User size={16} />;
    if (action.includes('Terminal') || action.includes('Command')) return <Terminal size={16} />;
    if (action.includes('Ticket') || action.includes('Repair')) return <Shield size={16} />;
    return <FileText size={16} />;
  };

  const successCount = logs.filter((log) => log.status === 'success').length;
  const warningCount = logs.filter((log) => log.status === 'warning').length;
  const errorCount = logs.filter((log) => log.status === 'error').length;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400">Live activity from MongoDB, refreshed every 5 seconds</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={exportLogs} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
            <Download size={20} />
            Export Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Logs" value={logs.length} icon={<FileText className="text-blue-400" size={24} />} />
        <StatCard label="Successful" value={successCount} icon={<Shield className="text-green-400" size={24} />} valueClass="text-green-400" />
        <StatCard label="Warnings" value={warningCount} icon={<AlertTriangle className="text-yellow-400" size={24} />} valueClass="text-yellow-400" />
        <StatCard label="Errors" value={errorCount} icon={<AlertTriangle className="text-red-400" size={24} />} valueClass="text-red-400" />
      </div>

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
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white">
            <option value="all">All Actions</option>
            {uniqueActions.map((action) => <option key={action} value={action}>{action}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white">
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

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
                <tr key={log._id || `${log.timestamp}-${log.user}-${log.action}`} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="text-sm">{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white">{log.user || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="text-slate-400">{getActionIcon(log.action)}</span>
                      <span>{log.action || '-'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{log.target || '-'}</td>
                  <td className="py-3 px-4"><code className="text-blue-400 text-sm">{log.command || '-'}</code></td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(log.status)}`}>{log.status || 'unknown'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filteredLogs.length === 0 && (
        <div className="form-card text-center py-12 mt-6">
          <FileText className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-400">No logs found</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, valueClass = 'text-white' }) {
  return (
    <div className="form-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function formatTimestamp(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}
