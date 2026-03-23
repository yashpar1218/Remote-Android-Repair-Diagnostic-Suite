import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  History,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Loader2
} from 'lucide-react';

const API_URL = 'http://localhost:5000';
const INR_FORMATTER = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function RepairHistory() {
  const { user, loading: authLoading } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const technicianId = toTechnicianId(user);

  useEffect(() => {
    if (authLoading) return;
    fetchHistory();
  }, [technicianId, authLoading]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      if (!technicianId) {
        setRecords([]);
        return;
      }
      const response = await axios.get(`${API_URL}/api/repairs`, {
        params: {
          technician_id: technicianId
        }
      });

      const normalizedRecords = (response.data || []).map((repair) => ({
        id: repair.ticket_id || repair._id,
        repairId: repair._id ?? repair.ticket_id,
        deviceName: repair.device_name || `${repair.device_brand || ''} ${repair.device_model || ''}`.trim() || 'Unknown device',
        deviceModel: repair.device_model || 'N/A',
        issue: repair.issue || 'No issue description recorded',
        issueCategory: repair.issue_category || 'General',
        status: repair.status === 'completed' ? 'completed' : repair.status === 'cancelled' ? 'failed' : 'resolved',
        technician: repair.technician_name || user?.name || 'Technician',
        startDate: repair.started_at || repair.createdAt,
        endDate: repair.completed_at || repair.updatedAt || repair.createdAt,
        actions: toStringList(repair.actions_taken),
        diagnosis: repair.diagnosis_summary || '',
        commands: toStringList(repair.commands_executed),
        firmwareUsed: toStringList(repair.firmware_used).join(', '),
        notes: toStringList(repair.repair_notes),
        cost: Number(repair.cost) || 0
      }));

      setRecords(normalizedRecords.sort((a, b) => new Date(b.endDate) - new Date(a.endDate)));
    } catch (error) {
      console.error('Error loading repair history:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => records.filter((record) => {
    const needle = searchTerm.toLowerCase();
    const matchesSearch = [record.deviceName, record.deviceModel, record.issue, record.id].join(' ').toLowerCase().includes(needle);
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [records, searchTerm, statusFilter]);

  const exportHistory = () => {
    if (!filteredHistory.length) return;
    const csv = [
      ['Ticket ID', 'Device', 'Model', 'Status', 'Technician', 'Started', 'Completed', 'Issue', 'Diagnosis', 'Actions', 'Cost (INR)'].join(','),
      ...filteredHistory.map((record) => [
        record.id,
        quote(record.deviceName),
        quote(record.deviceModel),
        record.status,
        quote(record.technician),
        quote(formatDate(record.startDate)),
        quote(formatDate(record.endDate)),
        quote(record.issue),
        quote(record.diagnosis),
        quote(record.actions.join('; ')),
        record.cost
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'repair-history.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const completedCount = records.filter((record) => record.status === 'completed').length;
  const resolvedCount = records.filter((record) => record.status === 'resolved').length;
  const totalRevenue = records.filter((record) => record.status === 'completed').reduce((sum, record) => sum + record.cost, 0);

  const getStatusColor = (status) => ({
    completed: 'bg-green-500/20 text-green-400',
    resolved: 'bg-blue-500/20 text-blue-400',
    failed: 'bg-red-500/20 text-red-400'
  }[status] || 'bg-slate-500/20 text-slate-400');

  const getStatusIcon = (status) => ({
    completed: <CheckCircle size={16} />,
    resolved: <Clock size={16} />,
    failed: <XCircle size={16} />
  }[status] || <Clock size={16} />);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-400" size={32} /></div>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Repair History</h1>
          <p className="text-slate-400">Completed and in-progress repair records saved for this technician</p>
        </div>
        <button onClick={exportHistory} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
          <Download size={18} />
          Export
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Repairs" value={records.length} icon={<History className="text-blue-400" size={24} />} />
        <StatCard label="Completed" value={completedCount} icon={<CheckCircle className="text-green-400" size={24} />} valueClass="text-green-400" />
        <StatCard label="Resolved" value={resolvedCount} icon={<Clock className="text-blue-400" size={24} />} valueClass="text-blue-400" />
        <StatCard label="Total Revenue" value={INR_FORMATTER.format(totalRevenue)} icon={<span className="text-yellow-400 text-xl font-bold">INR</span>} valueClass="text-yellow-400" />
      </div>

      <div className="form-card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Search by device, ticket, or issue..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="resolved">Resolved</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredHistory.map((record) => (
          <div key={record.repairId} className="form-card hover:border-blue-500 transition-colors cursor-pointer" onClick={() => setSelectedRecord(record)}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center"><Smartphone className="text-blue-400" size={24} /></div>
                <div>
                  <h3 className="font-semibold text-white">{record.deviceName}</h3>
                  <p className="text-sm text-slate-400">{record.deviceModel}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusColor(record.status)}`}>{getStatusIcon(record.status)}{titleCase(record.status)}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <InfoItem label="Ticket">{record.id}</InfoItem>
              <InfoItem label="Technician">{record.technician}</InfoItem>
              <InfoItem label="Completed">{formatDate(record.endDate)}</InfoItem>
              <InfoItem label="Cost">{INR_FORMATTER.format(record.cost)}</InfoItem>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300 line-clamp-2">{record.issue}</div>
              <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"><Eye size={16} />View Details</button>
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="form-card text-center py-12">
          <History className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-400">No repair history found</p>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="form-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Repair Details</h2>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Device">{selectedRecord.deviceName}</InfoItem>
                <InfoItem label="Model">{selectedRecord.deviceModel}</InfoItem>
              </div>
              <InfoItem label="Issue">{selectedRecord.issue}</InfoItem>
              <InfoItem label="Diagnosis">{selectedRecord.diagnosis || 'No diagnosis captured'}</InfoItem>
              <InfoItem label="Actions Performed">
                {selectedRecord.actions.length ? (
                  <div className="flex flex-wrap gap-2 mt-2">{selectedRecord.actions.map((action, index) => <span key={`${action}-${index}`} className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">{action}</span>)}</div>
                ) : 'No action details captured'}
              </InfoItem>
              <InfoItem label="Commands Used">
                {selectedRecord.commands.length ? <div className="space-y-2 mt-2">{selectedRecord.commands.map((command, index) => <code key={`${index}-${command}`} className="block rounded bg-slate-900 px-3 py-2 text-sm text-blue-400">{command}</code>)}</div> : 'No command log captured'}
              </InfoItem>
              <InfoItem label="Firmware Used">{selectedRecord.firmwareUsed || 'Not recorded'}</InfoItem>
              <InfoItem label="Repair Notes">
                {selectedRecord.notes.length ? <div className="space-y-2 mt-2">{selectedRecord.notes.map((note, index) => <p key={`${note}-${index}`} className="rounded bg-slate-800 px-3 py-2 text-sm text-slate-200">{note}</p>)}</div> : 'No repair notes captured'}
              </InfoItem>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Start Time">{formatDate(selectedRecord.startDate)}</InfoItem>
                <InfoItem label="End Time">{formatDate(selectedRecord.endDate)}</InfoItem>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <span className="text-slate-400">Total Cost</span>
                <span className="text-2xl font-bold text-green-400">{INR_FORMATTER.format(selectedRecord.cost)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, valueClass = 'text-white' }) {
  return <div className="form-card"><div className="flex items-center justify-between"><div><p className="text-slate-400 text-sm">{label}</p><p className={`text-2xl font-bold ${valueClass}`}>{value}</p></div>{icon}</div></div>;
}

function InfoItem({ label, children }) {
  return <div><p className="text-slate-400 text-sm">{label}</p><div className="text-white">{children}</div></div>;
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
}

function quote(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function titleCase(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

/** Match ActiveTickets / login: stable Mongo id string for API filters */
function toTechnicianId(user, stored) {
  const raw = user?.id ?? user?._id ?? stored?.id ?? stored?._id;
  if (raw == null) return '';
  if (typeof raw === 'object') return String(raw);
  return String(raw);
}

/** DB may store list fields as arrays or a single string — never throw on .join */
function toStringList(val) {
  if (val == null || val === '') return [];
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === 'string') {
    return val.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
  }
  return [String(val)];
}

