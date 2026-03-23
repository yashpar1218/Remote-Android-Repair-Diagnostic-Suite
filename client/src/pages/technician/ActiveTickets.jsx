import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Ticket,
  Search,
  Smartphone,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  User,
  AlertTriangle,
  Play,
  FileText,
  Check,
  Send,
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

const STATUS_LABELS = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  PAYMENT_PENDING: 'Payment Pending'
};

export default function ActiveTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [repairNotes, setRepairNotes] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRepairNoteModal, setShowRepairNoteModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveAmount, setResolveAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [repairNote, setRepairNote] = useState({
    diagnosis_summary: '',
    actions_taken: '',
    commands_executed: '',
    firmware_used: '',
    repair_status: 'in_progress'
  });

  const { user } = useAuth();
  const technicianId = user?.id || '';
  const technicianName = user?.name || 'Technician';

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, urgencyFilter, brandFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (urgencyFilter !== 'all') params.append('urgency_level', urgencyFilter);
      const response = await axios.get(`${API_URL}/api/tickets?${params.toString()}`);
      let filtered = response.data || [];
      if (brandFilter !== 'all') filtered = filtered.filter((ticket) => ticket.device_brand === brandFilter);
      if (searchTerm) {
        const needle = searchTerm.toLowerCase();
        filtered = filtered.filter((ticket) =>
          ticket.ticket_id.toLowerCase().includes(needle) ||
          ticket.customer_name.toLowerCase().includes(needle) ||
          ticket.device_model.toLowerCase().includes(needle)
        );
      }
      setTickets(filtered);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      setLoadingDetails(true);
      const [historyResponse, notesResponse] = await Promise.all([
        axios.get(`${API_URL}/api/tickets/${ticketId}/updates`),
        axios.get(`${API_URL}/api/tickets/${ticketId}/repair-notes`)
      ]);
      setTicketHistory(historyResponse.data || []);
      setRepairNotes(notesResponse.data || []);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const updateSelectedTicket = (ticket) => {
    setSelectedTicket(ticket);
    setTickets((current) => current.map((item) => item.ticket_id === ticket.ticket_id ? ticket : item));
  };

  const handleTicketClick = async (ticket) => {
    setSelectedTicket(ticket);
    await fetchTicketDetails(ticket.ticket_id);
  };

  const handleAcceptTicket = async (ticketId) => {
    try {
      setActionLoading(true);
      const response = await axios.put(`${API_URL}/api/tickets/${ticketId}/accept`, {
        technician_id: technicianId,
        technician_name: technicianName
      });
      const updatedTicket = response.data.ticket;
      if (updatedTicket) updateSelectedTicket(updatedTicket);
      await fetchTickets();
      if (selectedTicket?.ticket_id === ticketId) {
        await fetchTicketDetails(ticketId);
      }
      alert('Ticket accepted successfully!');
    } catch (err) {
      console.error('Error accepting ticket:', err);
      alert(err.response?.data?.error || 'Failed to accept ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || !selectedTicket) return;
    if (newStatus === 'PAYMENT_PENDING' && !selectedTicket.amount) {
      alert('Please add a repair cost before setting Payment Pending.');
      return;
    }
    try {
      setActionLoading(true);
      const response = await axios.put(`${API_URL}/api/tickets/${selectedTicket.ticket_id}/status`, {
        status: newStatus,
        technician_id: technicianId,
        technician_name: technicianName,
        message: statusMessage
      });
      if (response.data.ticket) {
        updateSelectedTicket(response.data.ticket);
      }
      await fetchTickets();
      await fetchTicketDetails(selectedTicket.ticket_id);
      setShowStatusModal(false);
      setNewStatus('');
      setStatusMessage('');
      alert('Status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUndoStatus = async () => {
    if (!selectedTicket) return;
    if (selectedTicket.payment_status === 'PAID') {
      alert('Payment is completed. Status cannot be undone.');
      return;
    }
    try {
      setActionLoading(true);
      const response = await axios.put(`${API_URL}/api/tickets/${selectedTicket.ticket_id}/undo-status`, {
        technician_id: technicianId,
        technician_name: technicianName
      });
      if (response.data.ticket) {
        updateSelectedTicket(response.data.ticket);
      }
      await fetchTickets();
      await fetchTicketDetails(selectedTicket.ticket_id);
      alert(response.data?.message || 'Status reverted');
    } catch (err) {
      console.error('Error undoing status:', err);
      alert(err.response?.data?.error || 'Failed to undo status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRepairNote = async () => {
    if (!selectedTicket) return;
    try {
      setActionLoading(true);
      await axios.post(`${API_URL}/api/tickets/${selectedTicket.ticket_id}/notes`, {
        technician_id: technicianId,
        technician_name: technicianName,
        ...repairNote
      });

      let nextStatus = selectedTicket.status;
      if (repairNote.repair_status === 'completed') nextStatus = 'RESOLVED';
      else if (selectedTicket.status === 'ASSIGNED') nextStatus = 'IN_PROGRESS';

      updateSelectedTicket({ ...selectedTicket, status: nextStatus, updated_at: new Date().toISOString() });
      await fetchTickets();
      await fetchTicketDetails(selectedTicket.ticket_id);
      setShowRepairNoteModal(false);
      setRepairNote({
        diagnosis_summary: '',
        actions_taken: '',
        commands_executed: '',
        firmware_used: '',
        repair_status: 'in_progress'
      });
      alert('Repair note added successfully!');
    } catch (err) {
      console.error('Error adding repair note:', err);
      alert(err.response?.data?.error || 'Failed to add repair note');
    } finally {
      setActionLoading(false);
    }
  };
  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    const amountValue = Number(resolveAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      alert('Please enter a valid repair cost');
      return;
    }
    try {
      setActionLoading(true);
      const response = await axios.put(`${API_URL}/api/tickets/${selectedTicket.ticket_id}/resolve`, {
        amount: amountValue,
        technician_id: technicianId,
        technician_name: technicianName
      });
      if (response.data.ticket) {
        updateSelectedTicket(response.data.ticket);
      }
      await fetchTickets();
      await fetchTicketDetails(selectedTicket.ticket_id);
      setShowResolveModal(false);
      setResolveAmount('');
      alert('Ticket resolved. Payment requested from customer.');
    } catch (err) {
      console.error('Error resolving ticket:', err);
      alert(err.response?.data?.error || 'Failed to resolve ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const brands = useMemo(() => [...new Set(tickets.map((ticket) => ticket.device_brand).filter(Boolean))], [tickets]);

  const getStatusColor = (status) => ({
    OPEN: 'bg-yellow-500/20 text-yellow-400',
    ASSIGNED: 'bg-blue-500/20 text-blue-400',
    IN_PROGRESS: 'bg-purple-500/20 text-purple-400',
    RESOLVED: 'bg-green-500/20 text-green-400',
    PAYMENT_PENDING: 'bg-amber-500/20 text-amber-400'
  }[status] || 'bg-slate-500/20 text-slate-400');

  const getStatusIcon = (status) => ({
    OPEN: <AlertCircle size={16} />,
    ASSIGNED: <User size={16} />,
    IN_PROGRESS: <Clock size={16} />,
    RESOLVED: <CheckCircle size={16} />,
    PAYMENT_PENDING: <AlertCircle size={16} />
  }[status] || <Clock size={16} />);

  const getUrgencyColor = (urgency) => ({ high: 'text-red-400', normal: 'text-blue-400', low: 'text-green-400' }[urgency] || 'text-slate-400');

  const formatDate = (value) => new Date(value).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const isPaymentCompleted = selectedTicket?.payment_status === 'PAID';

  const getAvailableStatusTransitions = (currentStatus) => {
    switch (currentStatus) {
      case 'OPEN':
        return [];
      case 'ASSIGNED':
        return [
          { value: 'IN_PROGRESS', label: STATUS_LABELS.IN_PROGRESS },
          { value: 'RESOLVED', label: STATUS_LABELS.RESOLVED }
        ];
      case 'IN_PROGRESS':
        return [
          { value: 'RESOLVED', label: STATUS_LABELS.RESOLVED },
          { value: 'PAYMENT_PENDING', label: STATUS_LABELS.PAYMENT_PENDING },

        ];
      default:
        return [];
    }
  };

  const getUpdateTypeIcon = (type) => ({
    created: <Ticket size={14} />,
    assigned: <User size={14} />,
    status_change: <Clock size={14} />,
    repair_note: <AlertTriangle size={14} />
  }[type] || <Ticket size={14} />);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-400" size={32} /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Active Tickets</h1>
        <p className="text-slate-400">Manage and process customer support tickets</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open" value={tickets.filter((ticket) => ticket.status === 'OPEN').length} icon={<AlertCircle className="text-yellow-400" size={24} />} valueClass="text-yellow-400" />
        <StatCard label="Assigned" value={tickets.filter((ticket) => ticket.status === 'ASSIGNED').length} icon={<User className="text-blue-400" size={24} />} valueClass="text-blue-400" />
        <StatCard label="In Progress" value={tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length} icon={<Clock className="text-purple-400" size={24} />} valueClass="text-purple-400" />
        <StatCard label="High Urgency" value={tickets.filter((ticket) => ticket.urgency_level === 'high' && ticket.status !== 'RESOLVED').length} icon={<AlertTriangle className="text-red-400" size={24} />} valueClass="text-red-400" />
      </div>

      <div className="form-card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Search tickets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && fetchTickets()} className="form-input pl-10" />
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
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white">
            <option value="all">All Brands</option>
            {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
          </select>
        </div>
      </div>

      <div className="form-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Ticket ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Device</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Issue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Urgency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {tickets.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-400">No tickets found</td></tr>
              ) : tickets.map((ticket) => (
                <tr key={ticket.ticket_id} className="hover:bg-slate-700/30">
                  <td className="px-4 py-3"><span className="font-mono text-sm text-blue-400">{ticket.ticket_id}</span></td>
                  <td className="px-4 py-3"><p className="text-white text-sm">{ticket.customer_name}</p><p className="text-slate-500 text-xs">{ticket.customer_email}</p></td>
                  <td className="px-4 py-3"><p className="text-white text-sm">{ticket.device_brand}</p><p className="text-slate-500 text-xs">{ticket.device_model}</p></td>
                  <td className="px-4 py-3"><p className="text-white text-sm">{ticket.issue_category}</p></td>
                  <td className="px-4 py-3"><span className={`text-sm font-medium ${getUrgencyColor(ticket.urgency_level)}`}>{ticket.urgency_level.toUpperCase()}</span></td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(ticket.status)}`}>{getStatusIcon(ticket.status)}{STATUS_LABELS[ticket.status] || ticket.status}</span></td>
                  <td className="px-4 py-3"><p className="text-slate-400 text-sm">{formatDate(ticket.created_at)}</p></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleTicketClick(ticket)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-blue-400" title="View Details"><Eye size={16} /></button>
                      {ticket.status === 'OPEN' && (
                        <button onClick={() => handleAcceptTicket(ticket.ticket_id)} disabled={actionLoading} className="p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white" title="Accept Ticket"><Check size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="form-card max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Ticket Details</h2>
                <p className="text-sm text-slate-400 font-mono">{selectedTicket.ticket_id}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="flex gap-3 mb-6 flex-wrap">
              {selectedTicket.status === 'OPEN' && (
                <button onClick={() => handleAcceptTicket(selectedTicket.ticket_id)} disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white disabled:opacity-50"><Check size={18} />Accept Ticket</button>
              )}
              {getAvailableStatusTransitions(selectedTicket.status).length > 0 && (
                <button onClick={() => setShowStatusModal(true)} disabled={isPaymentCompleted} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white"><Play size={18} />Update Status</button>
              )}
              {selectedTicket.status && (
                <button onClick={handleUndoStatus} disabled={isPaymentCompleted} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-white"><Send size={18} />Undo Status</button>
              )}
              {['ASSIGNED', 'IN_PROGRESS'].includes(selectedTicket.status) && (
                <button onClick={() => setShowRepairNoteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"><FileText size={18} />Add Repair Note</button>
              )}
              {['IN_PROGRESS', 'ASSIGNED', 'RESOLVED'].includes(selectedTicket.status) && (
                <button onClick={() => setShowResolveModal(true)} disabled={isPaymentCompleted} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg text-white"><Check size={18} />Add Cost</button>
              )}

            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <InfoBlock label="Status"><span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusColor(selectedTicket.status)}`}>{getStatusIcon(selectedTicket.status)}{STATUS_LABELS[selectedTicket.status] || selectedTicket.status}</span></InfoBlock>
              <InfoBlock label="Urgency"><p className={`text-white font-medium ${getUrgencyColor(selectedTicket.urgency_level)}`}>{selectedTicket.urgency_level.toUpperCase()}</p></InfoBlock>
              <InfoBlock label="Device"><p className="text-white">{selectedTicket.device_brand} {selectedTicket.device_model}</p></InfoBlock>
              <InfoBlock label="Issue Category"><p className="text-white">{selectedTicket.issue_category}</p></InfoBlock>
              <InfoBlock label="Customer"><p className="text-white">{selectedTicket.customer_name}</p></InfoBlock>
              <InfoBlock label="Technician"><p className="text-white">{selectedTicket.assigned_technician_name || 'Not assigned'}</p></InfoBlock>
            </div>

            <div className="mb-6"><p className="text-slate-400 text-sm mb-1">Issue Description</p><p className="text-white bg-slate-700/50 rounded-lg p-3">{selectedTicket.issue_description}</p></div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <InfoBlock label="Created"><p className="text-white">{formatDate(selectedTicket.created_at)}</p></InfoBlock>
              <InfoBlock label="Last Updated"><p className="text-white">{formatDate(selectedTicket.updated_at)}</p></InfoBlock>
            </div>

            <hr className="border-slate-700 my-6" />
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Repair Notes</h3>
              {repairNotes.length === 0 ? <p className="text-slate-400 text-sm">No repair notes yet</p> : (
                <div className="space-y-4">
                  {repairNotes.map((note) => (
                    <div key={note.repair_id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2"><p className="text-sm text-blue-400">{note.technician_name}</p><p className="text-xs text-slate-500">{formatDate(note.created_at)}</p></div>
                      {note.diagnosis_summary && <p className="text-white mb-2"><strong>Diagnosis:</strong> {note.diagnosis_summary}</p>}
                      {note.actions_taken && <p className="text-white mb-2"><strong>Actions:</strong> {note.actions_taken}</p>}
                      {note.commands_executed && <p className="text-slate-400 text-sm"><strong>Commands:</strong> {note.commands_executed}</p>}
                      {note.firmware_used && <p className="text-slate-400 text-sm"><strong>Firmware:</strong> {note.firmware_used}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-slate-700 my-6" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Ticket History</h3>
              {loadingDetails ? <div className="flex items-center justify-center py-4"><Loader2 className="animate-spin text-blue-400" size={24} /></div> : (
                <div className="space-y-3">
                  {ticketHistory.map((update) => (
                    <div key={update.update_id} className="flex items-start gap-3">
                      <div className="mt-1 text-slate-400">{getUpdateTypeIcon(update.update_type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><p className="text-white text-sm">{update.update_by_name}</p>{update.old_status && update.new_status && <span className="text-xs text-slate-500">{(STATUS_LABELS[update.old_status] || update.old_status) + ' -> ' + (STATUS_LABELS[update.new_status] || update.new_status)}</span>}</div>
                        <p className="text-slate-400 text-sm">{update.update_message}</p>
                        <p className="text-xs text-slate-500">{formatDate(update.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showStatusModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="form-card max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Update Ticket Status</h3>
            <div className="mb-4">
              <label className="form-label">New Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="form-input">
                <option value="">Select status...</option>
                {getAvailableStatusTransitions(selectedTicket.status).map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="form-label">Message (optional)</label>
              <textarea value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)} className="form-input" placeholder="Add a note about this status change..." rows={3} />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowStatusModal(false); setNewStatus(''); setStatusMessage(''); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">Cancel</button>
              <button onClick={handleUpdateStatus} disabled={!newStatus || actionLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white disabled:opacity-50">{actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}Update Status</button>
            </div>
          </div>
        </div>
      )}

      
      {showResolveModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="form-card max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Add Repair Cost</h3>
            <div className="mb-4">
              <label className="form-label">Enter Repair Cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={resolveAmount}
                onChange={(e) => setResolveAmount(e.target.value)}
                className="form-input"
                placeholder="e.g. 1499"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowResolveModal(false); setResolveAmount(''); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveTicket}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-white disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Submit & Request Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {showRepairNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="form-card max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Add Repair Note</h3>
            <div className="space-y-4">
              <FormTextArea label="Diagnosis Summary" value={repairNote.diagnosis_summary} onChange={(value) => setRepairNote({ ...repairNote, diagnosis_summary: value })} placeholder="What did you find?" />
              <FormTextArea label="Actions Taken" value={repairNote.actions_taken} onChange={(value) => setRepairNote({ ...repairNote, actions_taken: value })} placeholder="What steps did you take?" />
              <FormTextArea label="Commands Executed" value={repairNote.commands_executed} onChange={(value) => setRepairNote({ ...repairNote, commands_executed: value })} placeholder="ADB commands used..." />
              <div>
                <label className="form-label">Firmware Used</label>
                <input type="text" value={repairNote.firmware_used} onChange={(e) => setRepairNote({ ...repairNote, firmware_used: e.target.value })} className="form-input" placeholder="Firmware version if flashed" />
              </div>
              <div>
                <label className="form-label">Repair Status</label>
                <select value={repairNote.repair_status} onChange={(e) => setRepairNote({ ...repairNote, repair_status: e.target.value })} className="form-input">
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowRepairNoteModal(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">Cancel</button>
              <button onClick={handleAddRepairNote} disabled={actionLoading || (!repairNote.diagnosis_summary && !repairNote.actions_taken)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white disabled:opacity-50">{actionLoading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}Add Note</button>
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

function InfoBlock({ label, children }) {
  return <div><p className="text-slate-400 text-sm">{label}</p>{children}</div>;
}

function FormTextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="form-input" placeholder={placeholder} rows={2} />
    </div>
  );
}

















































