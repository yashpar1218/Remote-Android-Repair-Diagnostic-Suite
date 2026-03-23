import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Cpu,
  Globe,
  Loader2,
  MemoryStick,
  Monitor,
  Package,
  RefreshCw,
  Settings,
  Smartphone,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import DeviceSelectionGrid from '../../components/technician/DeviceSelectionGrid';

const JAVA_API = 'http://localhost:8080';

export default function DeviceSpecs() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDeviceInfo = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${JAVA_API}/api/adb/device-info/${deviceId}`);
      const data = await response.json();

      if (data.success) {
        setDeviceInfo(data.properties || {});
      } else {
        setError(data.error || 'Failed to fetch device info');
      }
    } catch (err) {
      console.error('Error fetching device info:', err);
      setError('Failed to connect to ADB service. Make sure Java service is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceInfo();
  }, [deviceId]);

  if (!deviceId) {
    return (
      <DeviceSelectionGrid
        title="Device Specifications"
        description="Choose a connected device to open its specifications."
        buildPath={(selectedId) => `/dashboard/specs/${selectedId}`}
      />
    );
  }

  const renderProperty = (icon, label, value) => {
    if (!value) return null;
    return (
      <div className="flex justify-between py-3 border-b border-slate-700 last:border-0 gap-4">
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-slate-400">{label}</span>
        </div>
        <span className="text-white font-medium text-right">{value}</span>
      </div>
    );
  };

  if (loading && !deviceInfo) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-slate-300">
        <Loader2 className="animate-spin text-blue-400" size={48} />
        Fetching device information...
      </div>
    );
  }

  if (error && !deviceInfo) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard/specs')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Device Specifications</h1>
            <p className="text-slate-400">Device ID: {deviceId}</p>
          </div>
          <button onClick={fetchDeviceInfo} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
            <RefreshCw size={18} />
            Retry
          </button>
        </div>

        <div className="form-card">
          <div className="flex items-center gap-4 text-red-400">
            <AlertCircle size={24} />
            <div>
              <h3 className="font-semibold">Error Fetching Device Info</h3>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard/specs')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Device Specifications</h1>
          <p className="text-slate-400">Device ID: {deviceId}</p>
        </div>
        <button onClick={fetchDeviceInfo} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white disabled:opacity-50">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <Link to={`/dashboard/logs/${deviceId}`} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm">View Logs</Link>
        <Link to={`/dashboard/partition/${deviceId}`} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm">Partition Health</Link>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Smartphone className="text-blue-400" size={20} />
            Device Identity
          </h3>
          <div className="space-y-1">
            {renderProperty(<Smartphone size={16} className="text-slate-500" />, 'Model', deviceInfo?.Model)}
            {renderProperty(<Monitor size={16} className="text-slate-500" />, 'Manufacturer', deviceInfo?.Manufacturer)}
            {renderProperty(<Cpu size={16} className="text-slate-500" />, 'Serial Number', deviceInfo?.['Serial Number'])}
          </div>
        </div>

        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="text-blue-400" size={20} />
            System Information
          </h3>
          <div className="space-y-1">
            {renderProperty(<Globe size={16} className="text-slate-500" />, 'Android Version', deviceInfo?.['Android Version'])}
            {renderProperty(<Cpu size={16} className="text-slate-500" />, 'SDK Version', deviceInfo?.['SDK Version'])}
            {renderProperty(<MemoryStick size={16} className="text-slate-500" />, 'Build', deviceInfo?.['Build'])}
          </div>
        </div>

        <div className="form-card lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="text-blue-400" size={20} />
            All Properties
          </h3>
          <div className="bg-slate-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
              {deviceInfo ? JSON.stringify(deviceInfo, null, 2) : 'No data available'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}


