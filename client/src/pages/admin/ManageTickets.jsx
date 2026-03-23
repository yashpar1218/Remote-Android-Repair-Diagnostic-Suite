import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Search,
  Ticket,
  Trash2,
  User
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

const STATUS_LABELS = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  PAYMENT_PENDING: 'Payment Pending'
};

const exportColumns = [
  'Ticket ID',
  'Customer Name',
  'Customer Email',
  'Device',
  'Issue Category',
  'Urgency',
  'Status',
  'Payment Status',
  'Amount',
  'Assigned Technician',
  'Created At',
  'Updated At'
];

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const toCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const exportTickets = (tickets) => {
  const rows = tickets.map((ticket) => ({
    'Ticket ID': ticket.ticket_id,
    'Customer Name': ticket.customer_name,
    'Customer Email': ticket.customer_email,
    Device: `${ticket.device_brand || ''} ${ticket.device_model || ''}`.trim(),
    'Issue Category': ticket.issue_category,
    Urgency: ticket.urgency_level,
    Status: STATUS_LABELS[ticket.status] || ticket.status,
    'Payment Status': ticket.payment_status,
    Amount: ticket.amount ?? '-',
    'Assigned Technician': ticket.assigned_technician_name || '-',
    'Created At': formatDate(ticket.created_at),
    'Updated At': formatDate(ticket.updated_at)
  }));

  const csv = [
    exportColumns.map(toCsvValue).join(','),
    ...rows.map((row) => exportColumns.map((column) => toCsvValue(row[column])).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tickets-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default function ManageTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, urgencyFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (urgencyFilter !== 'all') params.append('urgency_level', urgencyFilter);
      const response = await axios.get(`${API_URL}/api/tickets?${params.toString()}`);
      setTickets(response.data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    if (!searchTerm) return tickets;
    const needle = searchTerm.toLowerCase();
    return tickets.filter((ticket) =>
      ticket.ticket_id?.toLowerCase().includes(needle) ||
      ticket.customer_name?.toLowerCase().includes(needle) ||
      ticket.customer_email?.toLowerCase().includes(needle) ||
      ticket.device_model?.toLowerCase().includes(needle)
    );
  }, [tickets, searchTerm]);

  const handleExportAll = async () => {
    try {
      setExporting(true);
      const response = await axios.get(`${API_URL}/api/tickets`);
      exportTickets(response.data || []);
    } catch (err) {
      console.error('Error exporting tickets:', err);
      alert('Failed to export tickets');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm(`Delete ticket ${ticketId}? This will remove all related records.`)) return;
    try {
      setDeletingTicket(ticketId);
      await axios.delete(`${API_URL}/api/admin/tickets/${ticketId}`);
      setTickets((current) => current.filter((ticket) => ticket.ticket_id !== ticketId));
    } catch (err) {
      console.error('Error deleting ticket:', err);
      alert(err.response?.data?.error || 'Failed to delete ticket');
    } finally {
      setDeletingTicket('');
    }
  };

  const getStatusColor = (status) => ({
    OPEN: 'bg-yellow-500/20 text-yellow-400',
    ASSIGNED: 'bg-blue-500/20 text-blue-400',
    IN_PROGRESS: 'bg-purple-500/20 text-purple-400',
    RESOLVED: 'bg-green-500/20 text-green-400',
    PAYMENT_PENDING: 'bg-amber-500/20 text-amber-400'
  }[status] || 'bg-slate-500/20 text-slate-400');

  const getStatusIcon = (status) => ({
    OPEN: <AlertCircle size={14} />,
    ASSIGNED: <User size={14} />,
    IN_PROGRESS: <Clock size={14} />,
    RESOLVED: <CheckCircle size={14} />,
    PAYMENT_PENDING: <AlertCircle size={14} />
  }[status] || <Clock size={14} />);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Tickets</h1>
          <p className="text-slate-400">Delete tickets across the system and export ticket reports.</p>
        </div>
        <button
          type="button"
          onClick={handleExportAll}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
        >
          <Download size={18} />
          {exporting ? 'Exporting...' : 'Export All Tickets'}
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">{error}</div>}

      <div className="form-card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by ticket, customer, or device"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white">
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="PAYMENT_PENDING">Payment Pending</option>
          </select>
          <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white">
            <option value="all">All Urgency</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="form-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Ticket</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Device</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Issue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-400">Loading tickets...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-400">No tickets found</td></tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.ticket_id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Ticket size={16} className="text-blue-400" />
                        <span className="font-mono text-sm text-blue-400">{ticket.ticket_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{ticket.customer_name}</p>
                      <p className="text-slate-500 text-xs">{ticket.customer_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{ticket.device_brand} {ticket.device_model}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{ticket.issue_category}</p>
                      <p className="text-slate-500 text-xs">{ticket.urgency_level?.toUpperCase()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{ticket.payment_status || 'PENDING'}</p>
                      <p className="text-slate-500 text-xs">INR {ticket.amount ?? '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-400 text-sm">{formatDate(ticket.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteTicket(ticket.ticket_id)}
                        disabled={deletingTicket === ticket.ticket_id}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {deletingTicket === ticket.ticket_id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
