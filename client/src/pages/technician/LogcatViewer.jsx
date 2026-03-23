import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileCode,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';
import DeviceSelectionGrid from '../../components/technician/DeviceSelectionGrid';

const JAVA_API = 'http://localhost:8080';

const logLevels = [
  { value: 'all', label: 'All Levels' },
  { value: 'V', label: 'Verbose', color: 'text-slate-400' },
  { value: 'D', label: 'Debug', color: 'text-blue-400' },
  { value: 'I', label: 'Info', color: 'text-green-400' },
  { value: 'W', label: 'Warning', color: 'text-yellow-400' },
  { value: 'E', label: 'Error', color: 'text-red-400' },
  { value: 'F', label: 'Fatal', color: 'text-purple-400' }
];

export default function LogcatViewer() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const logEndRef = useRef(null);
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const fetchLogs = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${JAVA_API}/api/adb/logcat/${deviceId}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || '');
      } else {
        setError(data.error || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to connect to ADB service. Make sure Java service is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [deviceId]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!deviceId) {
    return (
      <DeviceSelectionGrid
        title="Logcat Viewer"
        description="Choose a connected device to inspect log output."
        buildPath={(selectedId) => `/dashboard/logs/${selectedId}`}
      />
    );
  }

  const parseLogs = (logString) => {
    if (!logString) return [];
    return logString.split('\n').filter((line) => line.trim()).map((line) => {
      const match = line.match(/^(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\w)\/([^:]+):\s*(.*)$/);
      if (match) {
        return { time: match[1], level: match[2], tag: match[3], message: match[4] };
      }
      return { time: '', level: '', tag: '', message: line };
    });
  };

  const parsedLogs = parseLogs(logs);
  const filteredLogs = parsedLogs.filter((log) => {
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesFilter = !filter || log.message.toLowerCase().includes(filter.toLowerCase()) || log.tag.toLowerCase().includes(filter.toLowerCase());
    return matchesLevel && matchesFilter;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'V': return 'text-slate-400';
      case 'D': return 'text-blue-400';
      case 'I': return 'text-green-400';
      case 'W': return 'text-yellow-400';
      case 'E': return 'text-red-400';
      case 'F': return 'text-purple-400';
      default: return 'text-slate-300';
    }
  };

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `logcat_${deviceId}_${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate('/dashboard/logs')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Logcat Viewer</h1>
          <p className="text-slate-400">Device ID: {deviceId}</p>
        </div>
        <button onClick={fetchLogs} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white disabled:opacity-50">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <button onClick={downloadLogs} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white" title="Download logs">
          <Download size={18} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <Link to={`/dashboard/specs/${deviceId}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm">Device Specs</Link>
        <Link to={`/dashboard/partition/${deviceId}`} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm">Partition Health</Link>
      </div>

      {error && !logs && (
        <div className="form-card mb-4">
          <div className="flex items-center gap-4 text-red-400">
            <AlertCircle size={24} />
            <div>
              <h3 className="font-semibold">Error Fetching Logs</h3>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search logs..." value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input pl-10" />
        </div>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
          {logLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
        </select>
      </div>

      <div className="flex gap-4 mb-4 text-xs flex-wrap">
        {logLevels.slice(1).map((level) => (
          <div key={level.value} className="flex items-center gap-1">
            <span className={level.color}>{level.value}</span>
            <span className="text-slate-400">-</span>
            <span className="text-slate-400">{level.label}</span>
          </div>
        ))}
      </div>

      {loading && !logs ? (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-300">
          <Loader2 className="animate-spin text-blue-400" size={48} />
          Fetching logs from device...
        </div>
      ) : (
        <div className="flex-1 terminal overflow-y-auto font-mono text-sm bg-slate-900 rounded-lg p-4">
          {filteredLogs.length ? (
            filteredLogs.map((log, index) => (
              <div key={index} className="flex gap-2 py-0.5 hover:bg-slate-800/50">
                {log.time ? (
                  <>
                    <span className="text-slate-500 shrink-0 w-12">{log.time}</span>
                    <span className={`shrink-0 w-5 ${getLevelColor(log.level)}`}>{log.level}</span>
                    <span className="text-purple-400 shrink-0 w-24 truncate">{log.tag}:</span>
                    <span className={`${getLevelColor(log.level)} break-all`}>{log.message}</span>
                  </>
                ) : (
                  <span className="text-slate-400 break-all">{log.message}</span>
                )}
              </div>
            ))
          ) : (
            <div className="text-slate-400 text-center py-8">No logs found matching the filter criteria</div>
          )}
          <div ref={logEndRef} />
        </div>
      )}

      <div className="flex items-center justify-between mt-2 text-sm text-slate-400">
        <span>Showing {filteredLogs.length} of {parsedLogs.length} log lines</span>
        <span>{loading ? <span className="flex items-center gap-2 text-blue-400"><Loader2 size={14} className="animate-spin" /> Fetching...</span> : <span className="text-green-400">Ready</span>}</span>
      </div>
    </div>
  );
}
