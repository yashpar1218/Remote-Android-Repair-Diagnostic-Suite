import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, Smartphone, Usb } from 'lucide-react';

const JAVA_API = 'http://localhost:8080';

export default function DeviceSelectionGrid({ title, description, buildPath }) {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await fetch(`${JAVA_API}/api/adb/devices`);
      const data = await response.json();

      if (data.success && data.devices) {
        setDevices(data.devices.map((deviceId) => ({ id: deviceId, name: deviceId, connection: 'USB' })));
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to load connected devices from the ADB service.');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  };

  const deviceList = useMemo(() => devices, [devices]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-300">
          <Loader2 className="animate-spin text-blue-400" size={28} />
          Loading connected devices...
        </div>
      ) : deviceList.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deviceList.map((device) => (
            <button
              key={device.id}
              type="button"
              onClick={() => navigate(buildPath(device.id))}
              className="form-card text-left hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                    <Smartphone className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{device.name}</h3>
                    <p className="text-sm text-slate-400">ID: {device.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Usb size={16} />
                  USB
                </div>
              </div>
              <p className="text-sm text-slate-400">Click to open this device.</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="form-card text-center py-12">
          <Smartphone className="mx-auto text-slate-600 mb-4" size={52} />
          <p className="text-slate-400">No connected devices found.</p>
        </div>
      )}
    </div>
  );
}
