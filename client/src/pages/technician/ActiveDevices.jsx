import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Battery,
  Loader2,
  RefreshCw,
  Search,
  Smartphone,
  Usb,
  Wifi
} from 'lucide-react';

const JAVA_API = 'http://localhost:8080';

export default function ActiveDevices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${JAVA_API}/api/adb/devices`);
      const data = await response.json();

      if (data.success) {
        const detailed = Array.isArray(data.deviceDetails) ? data.deviceDetails : [];
        if (detailed.length) {
          const deviceList = detailed
            .map((device) => {
              const id = device.id || device.deviceId || device.serial;
              if (!id) return null;
              const state = String(device.state || 'device').toLowerCase();
              const isOnline = state === 'device' || state.startsWith('fastboot');
              return {
                id,
                name: id,
                model: id,
                status: isOnline ? 'online' : 'offline',
                battery: 'N/A',
                connection: device.connectionType === 'wifi' ? 'WiFi' : 'USB',
                serialNumber: id
              };
            })
            .filter(Boolean);
          setDevices(deviceList);
        } else if (Array.isArray(data.devices)) {
          const deviceList = data.devices.map((deviceId) => ({
            id: deviceId,
            name: deviceId,
            model: deviceId,
            status: 'online',
            battery: 'N/A',
            connection: 'USB',
            serialNumber: deviceId
          }));
          setDevices(deviceList);
        } else {
          setDevices([]);
        }
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to connect to ADB service. Make sure Java service is running on port 8080.');
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

  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Active Devices</h1>
          <p className="text-slate-400">Click any connected device to open its specifications.</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors disabled:opacity-50">
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">{error}</div>}

      <div className="form-card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="      Search by device ID, name or model..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input pl-10" />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-400" size={48} />
          <span className="ml-3 text-slate-400">Connecting to ADB service...</span>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="form-card"><p className="text-slate-400 text-sm">Total Devices</p><p className="text-2xl font-bold text-white">{devices.length}</p></div>
            <div className="form-card"><p className="text-slate-400 text-sm">Online</p><p className="text-2xl font-bold text-green-400">{devices.filter((d) => d.status === 'online').length}</p></div>
            <div className="form-card"><p className="text-slate-400 text-sm">Busy</p><p className="text-2xl font-bold text-yellow-400">{devices.filter((d) => d.status === 'busy').length}</p></div>
            <div className="form-card"><p className="text-slate-400 text-sm">Offline</p><p className="text-2xl font-bold text-red-400">{devices.filter((d) => d.status === 'offline').length}</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredDevices.map((device) => (
              <button
                key={device.id}
                type="button"
                onClick={() => navigate(`/dashboard/specs/${device.id}`)}
                className="form-card text-left hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                      <Smartphone className="text-blue-400" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{device.name}</h3>
                      <p className="text-sm text-slate-400">ID: {device.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></span>
                    <span className="text-sm text-slate-400 capitalize">{device.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Battery className="text-green-400" size={18} />
                    <span className="text-sm text-slate-300">{device.battery}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.connection === 'WiFi' ? <Wifi className="text-blue-400" size={18} /> : <Usb className="text-blue-400" size={18} />}
                    <span className="text-sm text-slate-300">{device.connection}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 mb-3">Serial: {device.serialNumber}</div>
                <p className="text-sm text-slate-400">Open Specs, then switch to Logcat or Partition Health from there.</p>
              </button>
            ))}
          </div>
        </>
      )}

      {!loading && !error && filteredDevices.length === 0 && (
        <div className="form-card text-center py-12">
          <Smartphone className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-400">No devices found. Connect a device via USB and click Refresh.</p>
        </div>
      )}
    </div>
  );
}

