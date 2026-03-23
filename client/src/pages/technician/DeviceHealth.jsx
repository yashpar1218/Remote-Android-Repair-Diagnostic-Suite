import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Battery,
  Cpu,
  HardDrive,
  Loader2,
  RefreshCw,
  Thermometer,
  Ticket,
  MemoryStick
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import DeviceSelectionGrid from '../../components/technician/DeviceSelectionGrid';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000';
const JAVA_API = 'http://localhost:8080';

const formatMetric = (value, suffix, digits = 1) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  const numeric = Number(value);
  const rendered = digits === 0 ? Math.round(numeric) : numeric.toFixed(digits);
  return `${rendered}${suffix}`;
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getUsagePercent = (used, total) => {
  if (!Number.isFinite(Number(used)) || !Number.isFinite(Number(total)) || Number(total) <= 0) return 0;
  return Math.round((Number(used) / Number(total)) * 100);
};

const getProgressColor = (value, thresholds = { warning: 75, danger: 90 }) => {
  if (value >= thresholds.danger) return 'bg-red-500';
  if (value >= thresholds.warning) return 'bg-yellow-500';
  return 'bg-emerald-500';
};

export default function DeviceHealth() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ticketId, setTicketId] = useState(searchParams.get('ticketId') || '');
  const [history, setHistory] = useState([]);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [latestLog, setLatestLog] = useState(null);
  const [insights, setInsights] = useState({ totalLogs: 0, poorBatteryCount: 0, highStorageCount: 0, overheatingCount: 0 });
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanError, setScanError] = useState('');
  const { user } = useAuth();
  const technicianName = user?.name || 'Technician';

  const loadHistory = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      setError('');
      const [deviceResponse, ticketResponse] = await Promise.all([
        axios.get(`${API_URL}/api/device-health/${deviceId}`),
        ticketId ? axios.get(`${API_URL}/api/device-health/ticket/${ticketId}`) : Promise.resolve({ data: { logs: [] } })
      ]);

      setHistory(deviceResponse.data.logs || []);
      setLatestLog(deviceResponse.data.latest || null);
      setInsights(deviceResponse.data.insights || { totalLogs: 0, poorBatteryCount: 0, highStorageCount: 0, overheatingCount: 0 });
      setTicketHistory(ticketResponse.data.logs || []);
    } catch (err) {
      console.error('Error loading device health history:', err);
      setError(err.response?.data?.error || 'Failed to load device health history.');
      setHistory([]);
      setTicketHistory([]);
      setLatestLog(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [deviceId, ticketId]);

  const handleRunDiagnostics = async () => {
    if (!deviceId) return;

    try {
      setScanLoading(true);
      setScanError('');
      const diagnosticResponse = await axios.get(`${JAVA_API}/api/adb/device-health/${deviceId}`);
      if (!diagnosticResponse.data?.success || !diagnosticResponse.data?.metrics) {
        throw new Error(diagnosticResponse.data?.error || 'Device diagnostics failed');
      }

      const saveResponse = await axios.post(`${API_URL}/api/device-health`, {
        ...diagnosticResponse.data.metrics,
        ticket_id: ticketId || undefined,
        technician_name: technicianName
      });

      if (saveResponse.data?.log) {
        setLatestLog(saveResponse.data.log);
      }

      await loadHistory();
    } catch (err) {
      console.error('Error running device diagnostics:', err);
      setScanError(err.response?.data?.error || err.message || 'Failed to run diagnostics for this device.');
    } finally {
      setScanLoading(false);
    }
  };

  if (!deviceId) {
    return (
      <DeviceSelectionGrid
        title="Device Health Monitoring"
        description="Choose a connected device to run diagnostics and review historical health snapshots."
        buildPath={(selectedId) => `/technician/device-health/${selectedId}${ticketId ? `?ticketId=${encodeURIComponent(ticketId)}` : ''}`}
      />
    );
  }

  const current = latestLog || {};
  const storageUsage = current.storage_usage_percent ?? getUsagePercent(current.storage_used, current.storage_total);
  const ramUsage = current.ram_usage_percent ?? getUsagePercent(current.ram_used, current.ram_total);
  const chartData = history.map((log) => ({
    label: formatDateTime(log.created_at),
    battery: log.battery_health ?? 0,
    storage: log.storage_usage_percent ?? getUsagePercent(log.storage_used, log.storage_total),
    cpu: log.cpu_usage ?? 0,
    ram: log.ram_usage_percent ?? getUsagePercent(log.ram_used, log.ram_total),
    temperature: log.device_temperature ?? 0
  }));

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/technician/device-health')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Device Health Monitoring</h1>
            <p className="text-slate-400">Track battery, storage, RAM, CPU, and temperature for device {deviceId}</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={loadHistory} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white disabled:opacity-50">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh History
          </button>
          <button onClick={handleRunDiagnostics} disabled={scanLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white disabled:opacity-50">
            {scanLoading ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
            {scanLoading ? 'Running Scan...' : 'Run Diagnostic Scan'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Link to={`/dashboard/specs/${deviceId}`} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm">Device Specs</Link>
        <Link to={`/dashboard/partition/${deviceId}`} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm">Partition Health</Link>
        <Link to={`/dashboard/logs/${deviceId}`} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm">Logcat Viewer</Link>
      </div>

      <div className="form-card mb-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          <div className="flex-1">
            <label className="form-label">Ticket ID (optional)</label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={ticketId}
                onChange={(event) => setTicketId(event.target.value)}
                placeholder="     Link this scan to a ticket session"
                className="form-input pl-10"
              />
            </div>
          </div>
          <div className="text-sm text-slate-400 lg:max-w-md">
            Every diagnostic run creates a new `device_health_logs` snapshot. Add the active ticket ID to group scans collected during the same service session.
          </div>
        </div>
      </div>

      {(error || scanError) && (
        <div className="form-card mb-6 border border-red-500/30 bg-red-500/10">
          <div className="flex items-start gap-3 text-red-300">
            <AlertCircle className="mt-0.5" size={20} />
            <div>
              {error && <p>{error}</p>}
              {scanError && <p>{scanError}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <InsightCard label="Snapshots" value={insights.totalLogs ?? history.length} valueClass="text-white" />
        <InsightCard label="Poor Battery" value={insights.poorBatteryCount ?? 0} valueClass="text-yellow-400" />
        <InsightCard label="High Storage" value={insights.highStorageCount ?? 0} valueClass="text-orange-400" />
        <InsightCard label="Overheating" value={insights.overheatingCount ?? 0} valueClass="text-red-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <MetricPanel
          title="Battery Health"
          subtitle={current.created_at ? `Latest snapshot: ${formatDateTime(current.created_at)}` : 'Run a diagnostic scan to collect metrics.'}
          icon={<Battery className="text-emerald-400" size={20} />}
          valueLabel={formatMetric(current.battery_health, '%', 0)}
          secondaryLabel={`Battery temp: ${formatMetric(current.battery_temperature, ' C')}`}
          progress={current.battery_health ?? 0}
          colorClass={getProgressColor(current.battery_health ?? 0, { warning: 40, danger: 20 })}
        />
        <MetricPanel
          title="Storage Usage"
          subtitle={`${formatMetric(current.storage_used, ' GB')} used of ${formatMetric(current.storage_total, ' GB')}`}
          icon={<HardDrive className="text-blue-400" size={20} />}
          valueLabel={formatMetric(storageUsage, '%', 0)}
          secondaryLabel={`Used space: ${formatMetric(current.storage_used, ' GB')}`}
          progress={storageUsage}
          colorClass={getProgressColor(storageUsage)}
        />
        <MetricPanel
          title="RAM Usage"
          subtitle={`${formatMetric(current.ram_used, ' GB')} used of ${formatMetric(current.ram_total, ' GB')}`}
          icon={<MemoryStick className="text-violet-400" size={20} />}
          valueLabel={formatMetric(ramUsage, '%', 0)}
          secondaryLabel={`Memory used: ${formatMetric(current.ram_used, ' GB')}`}
          progress={ramUsage}
          colorClass={getProgressColor(ramUsage)}
        />
        <MetricPanel
          title="CPU and Temperature"
          subtitle={`Device temp: ${formatMetric(current.device_temperature, ' C')}`}
          icon={<Cpu className="text-orange-400" size={20} />}
          valueLabel={formatMetric(current.cpu_usage, '%', 0)}
          secondaryLabel={`CPU usage and thermal state from the latest scan`}
          progress={current.cpu_usage ?? 0}
          colorClass={getProgressColor(current.cpu_usage ?? 0, { warning: 65, danger: 85 })}
          footer={<p className="text-sm text-slate-400 mt-3 flex items-center gap-2"><Thermometer size={14} />Battery temp: {formatMetric(current.battery_temperature, ' C')} | Device temp: {formatMetric(current.device_temperature, ' C')}</p>}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4">Health History Trends</h3>
          {loading ? (
            <div className="h-[320px] flex items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin text-blue-400" size={24} />
              Loading history...
            </div>
          ) : chartData.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="label" stroke="#94a3b8" minTickGap={24} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                <Legend />
                <Line type="monotone" dataKey="battery" stroke="#22c55e" strokeWidth={2} name="Battery %" dot={false} />
                <Line type="monotone" dataKey="storage" stroke="#3b82f6" strokeWidth={2} name="Storage %" dot={false} />
                <Line type="monotone" dataKey="cpu" stroke="#f97316" strokeWidth={2} name="CPU %" dot={false} />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Temp  C" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-400 text-center">
              No saved health history yet. Run the first diagnostic scan to create a snapshot.
            </div>
          )}
        </div>

        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4">Ticket Session Logs</h3>
          {ticketId ? (
            ticketHistory.length ? (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {ticketHistory.map((log) => (
                  <div key={log._id} className="rounded-lg border border-slate-700 bg-slate-800/70 p-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <p className="text-white font-medium">{log.ticket_id}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(log.created_at)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <span className="text-slate-300">Battery: <span className="text-white">{formatMetric(log.battery_health, '%', 0)}</span></span>
                      <span className="text-slate-300">CPU: <span className="text-white">{formatMetric(log.cpu_usage, '%', 0)}</span></span>
                      <span className="text-slate-300">Storage: <span className="text-white">{formatMetric(log.storage_usage_percent, '%', 0)}</span></span>
                      <span className="text-slate-300">Temp: <span className="text-white">{formatMetric(log.device_temperature, ' C')}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-slate-400 text-center">
                No scans are linked to ticket {ticketId} yet.
              </div>
            )
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-400 text-center">
              Enter a ticket ID above to review the health history for a service session.
            </div>
          )}
        </div>
      </div>

      <div className="form-card">
        <h3 className="text-lg font-semibold text-white mb-4">Historical Snapshots</h3>
        {history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-700 text-left text-slate-400 text-sm">
                  <th className="py-3 pr-4">Captured</th>
                  <th className="py-3 pr-4">Ticket</th>
                  <th className="py-3 pr-4">Battery</th>
                  <th className="py-3 pr-4">Storage</th>
                  <th className="py-3 pr-4">RAM</th>
                  <th className="py-3 pr-4">CPU</th>
                  <th className="py-3 pr-4">Temperature</th>
                </tr>
              </thead>
              <tbody>
                {history.slice().reverse().map((log) => (
                  <tr key={log._id} className="border-b border-slate-800/80 text-sm">
                    <td className="py-3 pr-4 text-white">{formatDateTime(log.created_at)}</td>
                    <td className="py-3 pr-4 text-slate-300">{log.ticket_id || '-'}</td>
                    <td className="py-3 pr-4 text-slate-300">{formatMetric(log.battery_health, '%', 0)} / {formatMetric(log.battery_temperature, ' C')}</td>
                    <td className="py-3 pr-4 text-slate-300">{formatMetric(log.storage_used, ' GB')} / {formatMetric(log.storage_total, ' GB')} ({formatMetric(log.storage_usage_percent, '%', 0)})</td>
                    <td className="py-3 pr-4 text-slate-300">{formatMetric(log.ram_used, ' GB')} / {formatMetric(log.ram_total, ' GB')} ({formatMetric(log.ram_usage_percent, '%', 0)})</td>
                    <td className="py-3 pr-4 text-slate-300">{formatMetric(log.cpu_usage, '%', 0)}</td>
                    <td className="py-3 pr-4 text-slate-300">{formatMetric(log.device_temperature, ' C')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400">No device health logs saved yet for this device.</p>
        )}
      </div>
    </div>
  );
}

function InsightCard({ label, value, valueClass }) {
  return (
    <div className="form-card">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function MetricPanel({ title, subtitle, icon, valueLabel, secondaryLabel, progress, colorClass, footer }) {
  const safeProgress = Math.max(0, Math.min(progress || 0, 100));

  return (
    <div className="form-card">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">{icon}{title}</h3>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>
        <p className="text-3xl font-bold text-white">{valueLabel}</p>
      </div>
      <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${safeProgress}%` }} />
      </div>
      <p className="text-sm text-slate-400 mt-3">{secondaryLabel}</p>
      {footer}
    </div>
  );
}

