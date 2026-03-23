import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Ticket, 
  Search, 
  Filter, 
  Smartphone,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Calendar,
  User,
  AlertTriangle,
  LogOut,
  Cable
} from 'lucide-react';

export default function MyTickets() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [repairNotes, setRepairNotes] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/customer/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // Filter tickets by logged-in customer
      const response = await axios.get(`http://localhost:5000/api/tickets?customer_id=${user.id}`);
      setTickets(response.data);
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
      
      // Fetch ticket history
      const historyResponse = await axios.get(`http://localhost:5000/api/tickets/${ticketId}/updates`);
      setTicketHistory(historyResponse.data);

      // Fetch repair notes
      const notesResponse = await axios.get(`http://localhost:5000/api/tickets/${ticketId}/repair-notes`);
      setRepairNotes(notesResponse.data);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleTicketClick = async (ticket) => {
    setSelectedTicket(ticket);
    await fetchTicketDetails(ticket.ticket_id);
  };

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
  };

  const getTicketStatus = (ticket) => (ticket?.payment_status === 'PAID' ? 'RESOLVED' : ticket?.status);

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-yellow-500/20 text-yellow-400';
      case 'ASSIGNED': return 'bg-blue-500/20 text-blue-400';
      case 'IN_PROGRESS': return 'bg-purple-500/20 text-purple-400';
      case 'RESOLVED': return 'bg-green-500/20 text-green-400';
      case 'PAYMENT_PENDING': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN': return <AlertCircle size={16} />;
      case 'ASSIGNED': return <User size={16} />;
      case 'IN_PROGRESS': return <Clock size={16} />;
      case 'RESOLVED': return <CheckCircle size={16} />;
      case 'PAYMENT_PENDING': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-400';
      case 'normal': return 'text-blue-400';
      case 'low': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUpdateTypeIcon = (type) => {
    switch (type) {
      case 'created': return <Ticket size={14} />;
      case 'assigned': return <User size={14} />;
      case 'status_change': return <Clock size={14} />;
      case 'repair_note': return <AlertTriangle size={14} />;
      default: return <Ticket size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-400" size={32} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Tickets</h1>
        <p className="text-slate-400">Track your support requests and repair status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Tickets</p>
              <p className="text-2xl font-bold text-white">{tickets.length}</p>
            </div>
            <Ticket className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Open</p>
              <p className="text-2xl font-bold text-yellow-400">
                {tickets.filter(t => t.status === 'OPEN').length}
              </p>
            </div>
            <AlertCircle className="text-yellow-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-purple-400">
                {tickets.filter(t => t.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <Clock className="text-purple-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Resolved</p>
              <p className="text-2xl font-bold text-green-400">
                {tickets.filter(t => t.status === 'RESOLVED').length}
              </p>
            </div>
            <CheckCircle className="text-green-400" size={24} />
          </div>
        </div>
      </div>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <div className="form-card text-center py-12">
          <Ticket className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-400 mb-4">No tickets found</p>
          <Link
            to="/customer/support"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            Create New Ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div 
              key={ticket.ticket_id} 
              className="form-card hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => handleTicketClick(ticket)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                    <Smartphone className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{ticket.ticket_id}</h3>
                    <p className="text-sm text-slate-400">
                      {ticket.device_brand} {ticket.device_model}
                    </p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusColor(getTicketStatus(ticket))}`}>
                  {getStatusIcon(getTicketStatus(ticket))}
                  {getTicketStatus(ticket).replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Issue Category</p>
                  <p className="text-sm text-white">{ticket.issue_category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Urgency</p>
                  <p className={`text-sm font-medium ${getUrgencyColor(ticket.urgency_level)}`}>
                    {ticket.urgency_level.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Created</p>
                  <p className="text-sm text-white">{formatDate(ticket.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Technician</p>
                  <p className="text-sm text-white">
                    {ticket.assigned_technician_name || 'Not assigned'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400 truncate max-w-md">
                  {ticket.issue_description}
                </p>
                <div className="flex items-center gap-3">
                  {ticket.status === 'PAYMENT_PENDING' && ticket.payment_status !== 'PAID' && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-amber-300">Payable: INR {ticket.amount ?? '-'} </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/customer/payment/${ticket.ticket_id}`); }}
                        className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm"
                      >
                        Pay Now
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/customer/wizard?ticket=${ticket.ticket_id}${ticket.device_id ? `&device=${encodeURIComponent(ticket.device_id)}` : ''}`}
                      className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm"
                    >
                      <Cable size={16} />
                      Start Wizard
                    </Link>
                    <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm">
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="form-card max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Ticket Details</h2>
                <p className="text-sm text-slate-400">{selectedTicket.ticket_id}</p>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Ticket Info */}
            <div className="flex items-center justify-between mb-4">
              {selectedTicket.status === 'PAYMENT_PENDING' && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-amber-300">Payable Amount: INR {selectedTicket.amount ?? '-'} </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/customer/payment/${selectedTicket.ticket_id}`)}
                    className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm"
                  >
                    Proceed to Payment
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusIcon(selectedTicket.status)}
                  {selectedTicket.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Urgency</p>
                <p className={`text-white font-medium ${getUrgencyColor(selectedTicket.urgency_level)}`}>
                  {selectedTicket.urgency_level.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Device</p>
                <p className="text-white">{selectedTicket.device_brand} {selectedTicket.device_model}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Issue Category</p>
                <p className="text-white">{selectedTicket.issue_category}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-slate-400 text-sm mb-1">Issue Description</p>
              <p className="text-white">{selectedTicket.issue_description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-slate-400 text-sm">Created</p>
                <p className="text-white">{formatDate(selectedTicket.created_at)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Last Updated</p>
                <p className="text-white">{formatDate(selectedTicket.updated_at)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Assigned Technician</p>
                <p className="text-white">{selectedTicket.assigned_technician_name || 'Not assigned'}</p>
              </div>
            </div>

            <hr className="border-slate-700 my-6" />

            {/* Repair Notes */}
            {repairNotes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Repair Notes</h3>
                <div className="space-y-4">
                  {repairNotes.map((note) => (
                    <div key={note.repair_id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-400">{note.technician_name}</p>
                        <p className="text-xs text-slate-500">{formatDate(note.created_at)}</p>
                      </div>
                      {note.diagnosis_summary && (
                        <p className="text-white mb-2"><strong>Diagnosis:</strong> {note.diagnosis_summary}</p>
                      )}
                      {note.actions_taken && (
                        <p className="text-white mb-2"><strong>Actions:</strong> {note.actions_taken}</p>
                      )}
                      {note.commands_executed && (
                        <p className="text-slate-400 text-sm"><strong>Commands:</strong> {note.commands_executed}</p>
                      )}
                      {note.firmware_used && (
                        <p className="text-slate-400 text-sm"><strong>Firmware:</strong> {note.firmware_used}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-slate-700 my-6" />

            {/* Ticket History */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Ticket History</h3>
              {loadingDetails ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin text-blue-400" size={24} />
                </div>
              ) : (
                <div className="space-y-3">
                  {ticketHistory.map((update) => (
                    <div key={update.update_id} className="flex items-start gap-3">
                      <div className="mt-1 text-slate-400">
                        {getUpdateTypeIcon(update.update_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm">{update.updated_by_name}</p>
                          {update.old_status && update.new_status && (
                            <span className="text-xs text-slate-500">
                              {update.old_status} → {update.new_status}
                            </span>
                          )}
                        </div>
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
    </div>
  );
}























