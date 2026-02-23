import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileCode, 
  ArrowLeft, 
  Play, 
  Square, 
  Trash2, 
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Info,
  XCircle,
  Bug,
  BookOpen,
} from 'lucide-react';

// Mock logcat data
const mockLogs = [
  { time: '12:34:56.123', level: 'V', tag: 'ActivityManager', message: 'Start proc com.android.systemui for service com.android.systemui/.SystemUIService' },
  { time: '12:34:56.234', level: 'I', tag: 'ActivityManager', message: 'Process com.android.systemui (pid 1234) has started' },
  { time: '12:34:57.001', level: 'D', tag: 'WindowManager', message: 'Focus trade mCurrentFocus=Window{abc123 com.android.launcher/com.android.launcher.Launcher}' },
  { time: '12:34:57.456', level: 'W', tag: 'PowerManagerService', message: 'Screen on took too long: 523ms' },
  { time: '12:34:58.123', level: 'E', tag: 'BatteryService', message: 'Battery temperature too high: 45°C' },
  { time: '12:34:58.234', level: 'I', tag: 'WifiService', message: 'WifiStateMachine: CMD_START_SCAN' },
  { time: '12:34:59.001', level: 'D', tag: 'BluetoothAdapter', message: 'Bluetooth is enabled' },
  { time: '12:35:00.123', level: 'V', tag: 'AudioService', message: 'Volume changed: 7->15' },
  { time: '12:35:01.234', level: 'I', tag: 'PackageManager', message: 'Package com.android.chrome installed' },
  { time: '12:35:02.001', level: 'W', tag: 'StrictMode', message: 'DiskRead took too long: 234ms' },
  { time: '12:35:02.456', level: 'E', tag: 'System.err', message: 'java.io.FileNotFoundException: /data/data/com.app/files/config.txt' },
  { time: '12:35:03.123', level: 'D', tag: 'LocationManagerService', message: 'Request location updates from provider gps' },
];

const logLevels = [
  { value: 'all', label: 'All Levels' },
  { value: 'V', label: 'Verbose', color: 'text-slate-400' },
  { value: 'D', label: 'Debug', color: 'text-blue-400' },
  { value: 'I', label: 'Info', color: 'text-green-400' },
  { value: 'W', label: 'Warning', color: 'text-yellow-400' },
  { value: 'E', label: 'Error', color: 'text-red-400' },
  { value: 'F', label: 'Fatal', color: 'text-purple-400' },
];

export default function LogcatViewer() {
  const { deviceId } = useParams();
  const [logs, setLogs] = useState(mockLogs);
  const [isStreaming, setIsStreaming] = useState(false);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef(null);

  useEffect(() => {
    if (autoScroll && isStreaming) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isStreaming]);

  // Simulate streaming logs
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const newLog = {
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        level: ['V', 'D', 'I', 'W', 'E'][Math.floor(Math.random() * 5)],
        tag: ['ActivityManager', 'WindowManager', 'PowerManager', 'WifiService', 'BluetoothAdapter'][Math.floor(Math.random() * 5)],
        message: 'Log message ' + Math.floor(Math.random() * 1000)
      };
      setLogs(prev => [...prev.slice(-200), newLog]); // Keep last 200 logs
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming]);

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

  const getLevelIcon = (level) => {
    switch (level) {
      case 'E': return <Error size={14} className="text-red-400" />;
      case 'W': return <Warning size={14} className="text-yellow-400" />;
      case 'I': return <Info size={14} className="text-green-400" />;
      case 'D': return <Debug size={14} className="text-blue-400" />;
      default: return <span className="text-slate-400">-</span>;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesTag = tagFilter === 'all' || log.tag === tagFilter;
    const matchesFilter = !filter || 
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.tag.toLowerCase().includes(filter.toLowerCase());
    return matchesLevel && matchesTag && matchesFilter;
  });

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const text = logs.map(l => `${l.time} ${l.level}/${l.tag}: ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logcat.txt';
    a.click();
  };

  const uniqueTags = [...new Set(logs.map(l => l.tag))];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          to="/dashboard/devices"
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Logcat Viewer</h1>
          <p className="text-slate-400">Samsung Galaxy S21 - SM-G991B</p>
        </div>
        
        <button
          onClick={() => setIsStreaming(!isStreaming)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {isStreaming ? (
            <>
              <Square size={18} />
              Stop
            </>
          ) : (
            <>
              <Play size={18} />
              Stream
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-input pl-10"
          />
        </div>
        
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          {logLevels.map(level => (
            <option key={level.value} value={level.value}>{level.label}</option>
          ))}
        </select>

        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">All Tags</option>
          {uniqueTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-white text-sm">Auto-scroll</span>
        </label>

        <button
          onClick={clearLogs}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
          title="Clear logs"
        >
          <Trash2 size={18} />
        </button>

        <button
          onClick={downloadLogs}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
          title="Download logs"
        >
          <Download size={18} />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs">
        {logLevels.slice(1).map(level => (
          <div key={level.value} className="flex items-center gap-1">
            <span className={level.color}>{level.value}</span>
            <span className="text-slate-400">-</span>
            <span className="text-slate-400">{level.label}</span>
          </div>
        ))}
      </div>

      {/* Log Output */}
      <div className="flex-1 terminal overflow-y-auto font-mono text-sm">
        {filteredLogs.map((log, index) => (
          <div key={index} className="flex gap-2 py-0.5 hover:bg-slate-800/50">
            <span className="text-slate-500 shrink-0 w-12">{log.time}</span>
            <span className={`shrink-0 w-5 ${getLevelColor(log.level)}`}>{log.level}</span>
            <span className="text-purple-400 shrink-0 w-20 truncate">{log.tag}:</span>
            <span className={`${getLevelColor(log.level)} break-all`}>{log.message}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mt-2 text-sm text-slate-400">
        <span>Showing {filteredLogs.length} of {logs.length} logs</span>
        <span>
          {isStreaming ? (
            <span className="flex items-center gap-2 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Streaming...
            </span>
          ) : (
            <span className="text-slate-500">Paused</span>
          )}
        </span>
      </div>
    </div>
  );
}
