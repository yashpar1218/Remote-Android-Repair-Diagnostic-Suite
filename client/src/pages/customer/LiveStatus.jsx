import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Smartphone,
  Terminal,
  User
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'text-green-400';
    case 'in-progress':
      return 'text-blue-400';
    case 'pending':
      return 'text-slate-500';
    default:
      return 'text-slate-400';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return <CheckCircle size={20} />;
    case 'in-progress':
      return <Loader2 size={20} className="animate-spin" />;
    case 'pending':
      return <Clock size={20} />;
    default:
      return <Clock size={20} />;
  }
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

function buildStages(ticket, updates, repairNotes) {
  const diagnosisDone = repairNotes.length > 0;
  const inProgress = ticket?.status === 'IN_PROGRESS';
  const resolved = ticket?.status === 'RESOLVED';
    const repairDone = ['PAYMENT_PENDING', 'RESOLVED'].includes(ticket?.status);
  const assigned = ['ASSIGNED', 'IN_PROGRESS', 'PAYMENT_PENDING', 'RESOLVED'].includes(ticket?.status);

  return [
    {
      id: 'request',
      name: 'Support Request Received',
      status: ticket ? 'completed' : 'pending',
      time: formatDate(ticket?.created_at),
      detail: ticket?.issue_description || 'Waiting for ticket details.'
    },
    {
      id: 'assign',
      name: 'Technician Assigned',
      status: assigned ? 'completed' : 'pending',
      time: formatDate(ticket?.updated_at),
      detail: ticket?.assigned_technician_name || 'Waiting for technician assignment.'
    },
    {
      id: 'diagnosis',
      name: 'Diagnosis',
      status: diagnosisDone ? 'completed' : inProgress ? 'in-progress' : 'pending',
      time: formatDate(repairNotes[repairNotes.length - 1]?.created_at),
      detail: repairNotes[0]?.diagnosis_summary || 'No diagnosis has been added yet.'
    },
    {
      id: 'repair',
      name: 'Repair Work',
      status: repairDone ? 'completed' : inProgress ? 'in-progress' : 'pending',
      time: formatDate(repairNotes[0]?.created_at || ticket?.updated_at),
      detail: repairNotes[0]?.actions_taken || updates[0]?.update_message || 'Waiting for repair work to begin.'
    },
    {
      id: 'completion',
      name: 'Completion',
      status: resolved ? 'completed' : ticket?.status === 'PAYMENT_PENDING' ? 'in-progress' : 'pending',
      time: formatDate(ticket?.updated_at),
      detail: resolved ? 'Repair resolved and payment complete.' : ticket?.status === 'PAYMENT_PENDING' ? 'Payment is pending from the customer.' : 'Ticket is still being worked on.'
    }
  ];
}

export default function LiveStatus() {
  const { user } = useAuth();
  const { ticketId: routeTicketId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedTicketId = routeTicketId || searchParams.get('ticket');

  const [ticketId, setTicketId] = useState(requestedTicketId || '');
  const [liveStatus, setLiveStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const resolveTicketId = async () => {
      if (requestedTicketId) {
        setTicketId(requestedTicketId);
        return;
      }

      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/tickets?customer_id=${user.id}`);
        const latestTicket = (response.data || [])[0];
        setTicketId(latestTicket?.ticket_id || '');
      } catch (err) {
        console.error('Error loading tickets for live status:', err);
        setError('Failed to load your tickets.');
        setLoading(false);
      }
    };

    resolveTicketId();
  }, [requestedTicketId, user?.id]);

  useEffect(() => {
    const fetchLiveStatus = async ({ background = false } = {}) => {
      if (!ticketId) {
        setLoading(false);
        return;
      }

      try {
        if (background && liveStatus) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');
        const [ticketResponse, updatesResponse, notesResponse] = await Promise.all([
          axios.get(`${API_URL}/api/tickets/${ticketId}`),
          axios.get(`${API_URL}/api/tickets/${ticketId}/updates`),
          axios.get(`${API_URL}/api/tickets/${ticketId}/repair-notes`)
        ]);

        const ticket = ticketResponse.data;
        const updates = updatesResponse.data || [];
        const repairNotes = notesResponse.data || [];
        const progressByStatus = { OPEN: 10, ASSIGNED: 25, IN_PROGRESS: 60, PAYMENT_PENDING: 90, RESOLVED: 100 };
        const latestNote = repairNotes[0] || null;
        const latestUpdate = updates[0] || null;

        setLiveStatus({
          ticket,
          updates,
          repairNotes,
          progress: progressByStatus[ticket.status] || 0,
          currentAction: latestNote?.actions_taken || latestNote?.diagnosis_summary || latestUpdate?.update_message || 'Waiting for technician update',
          latestDiagnosis: latestNote?.diagnosis_summary || '',
          selectedDevice: {
            id: ticket.device_id || '',
            name: ticket.device_name || '',
            brand: ticket.device_brand || '',
            model: ticket.device_model || ''
          }
        });
      } catch (err) {
        console.error('Error loading live status:', err);
        setError(err.response?.data?.error || 'Failed to load live status.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchLiveStatus();
    const intervalId = setInterval(() => fetchLiveStatus({ background: true }), 5000);
    return () => clearInterval(intervalId);
  }, [ticketId]);

  const stages = useMemo(() => buildStages(liveStatus?.ticket, liveStatus?.updates || [], liveStatus?.repairNotes || []), [liveStatus]);
  const latestRepairNote = liveStatus?.repairNotes?.[0];

  if (loading && !liveStatus) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-slate-300">
        <Loader2 className="animate-spin text-blue-400" size={28} />
        Loading live repair status...
      </div>
    );
  }

  if (error && !liveStatus) {
    return <div className="text-red-400">{error}</div>;
  }

  if (!liveStatus?.ticket) {
    return (
      <div className="form-card text-center py-12">
        <Activity className="mx-auto text-slate-600 mb-4" size={42} />
        <p className="text-slate-300 mb-4">No live repair status is available yet.</p>
        <Link to="/customer/tickets" className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
          View My Tickets
        </Link>
      </div>
    );
  }

  const ticket = liveStatus.ticket;
  const selectedDevice = liveStatus.selectedDevice;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Repair Status</h1>
          <p className="text-slate-400">Track the progress of your device repair in real-time</p>
        </div>
        <div className="text-sm text-slate-400 min-h-6">
          {refreshing ? (
            <span className="inline-flex items-center gap-2 text-blue-400">
              <Loader2 size={16} className="animate-spin" />
              Refreshing...
            </span>
          ) : (
            <span>Auto-refresh every 5 seconds</span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-300">
          {error}
        </div>
      )}

      <div className="form-card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center">
            <Smartphone className="text-blue-400" size={32} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">
              {selectedDevice?.brand} {selectedDevice?.model}
            </h2>
            <p className="text-slate-400">Model: {ticket.device_model} | Issue: {ticket.issue_category}</p>
            <p className="text-slate-500 text-sm">Request ID: {ticket.ticket_id}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">{liveStatus.progress}%</div>
            <p className="text-slate-400 text-sm">Complete</p>
          </div>
        </div>
      </div>

      <div className="form-card mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Overall Progress</h3>
        <div className="w-full bg-slate-700 rounded-full h-4 mb-4">
          <div className="bg-blue-500 h-4 rounded-full transition-all duration-500" style={{ width: `${liveStatus.progress}%` }} />
        </div>
        <div className="flex justify-between text-sm text-slate-400">
          <span>Started: {formatDate(ticket.created_at)}</span>
          <span>Last update: {formatDate(ticket.updated_at)}</span>
        </div>
      </div>

      <div className="form-card">
        <h3 className="text-lg font-semibold text-white mb-4">Repair Stages</h3>
        <div className="space-y-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`flex items-center gap-4 p-4 rounded-lg ${
                stage.status === 'in-progress'
                  ? 'bg-blue-500/10 border border-blue-500/30'
                  : stage.status === 'completed'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-slate-700/30'
              }`}
            >
              <div className={getStatusColor(stage.status)}>{getStatusIcon(stage.status)}</div>
              <div className="flex-1">
                <h4 className={`font-medium ${stage.status === 'pending' ? 'text-slate-500' : 'text-white'}`}>{stage.name}</h4>
                <p className="text-sm text-slate-400">{stage.detail}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm ${getStatusColor(stage.status)}`}>{stage.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-card mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Action</h3>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="text-blue-400" size={20} />
            <span className="text-blue-400 font-medium">{liveStatus.currentAction}</span>
          </div>
          {liveStatus.latestDiagnosis && (
            <p className="text-slate-300 text-sm">Latest diagnosis: {liveStatus.latestDiagnosis}</p>
          )}
        </div>
      </div>

      <div className="form-card mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Assigned Technician</h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
            <User className="text-blue-400" size={22} />
          </div>
          <div>
            <p className="text-white font-medium">{ticket.assigned_technician_name || 'Not assigned yet'}</p>
            <p className="text-slate-400 text-sm">Customer-visible technician updates appear here automatically.</p>
          </div>
        </div>
      </div>

      {latestRepairNote && (
        <div className="form-card mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Latest Diagnosis & Actions</h3>
          <div className="space-y-3 text-sm">
            {latestRepairNote.diagnosis_summary && <p className="text-slate-200"><strong>Diagnosis:</strong> {latestRepairNote.diagnosis_summary}</p>}
            {latestRepairNote.actions_taken && <p className="text-slate-200"><strong>Actions:</strong> {latestRepairNote.actions_taken}</p>}
            {latestRepairNote.commands_executed && <p className="text-slate-400"><strong>Commands:</strong> {latestRepairNote.commands_executed}</p>}
            {latestRepairNote.firmware_used && <p className="text-slate-400"><strong>Firmware:</strong> {latestRepairNote.firmware_used}</p>}
          </div>
        </div>
      )}

      <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-yellow-400 text-sm">
            <p className="font-medium">Important</p>
            <p className="text-yellow-400/70">Please keep your device connected to the computer and avoid disconnecting until the repair is complete.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


