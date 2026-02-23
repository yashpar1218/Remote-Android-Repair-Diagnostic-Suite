import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Smartphone, 
  Battery, 
  Wifi, 
  Usb, 
  MoreVertical,
  Search,
  RefreshCw,
  Terminal,
  HardDrive,
  FileCode
} from 'lucide-react';

// Mock data for connected devices
const mockDevices = [
  {
    id: '1',
    name: 'Samsung Galaxy S21',
    model: 'SM-G991B',
    status: 'online',
    battery: 85,
    connection: 'USB',
    imei: '356987401234567',
    bootloader: 'Locked',
    rom: 'Android 13',
    lastSeen: '2 min ago'
  },
  {
    id: '2',
    name: 'OnePlus 9 Pro',
    model: 'LE2123',
    status: 'online',
    battery: 62,
    connection: 'WiFi',
    imei: '356987401234568',
    bootloader: 'Unlocked',
    rom: 'Android 12',
    lastSeen: '5 min ago'
  },
  {
    id: '3',
    name: 'Xiaomi Mi 11',
    model: 'M2011K2G',
    status: 'busy',
    battery: 45,
    connection: 'USB',
    imei: '356987401234569',
    bootloader: 'Locked',
    rom: 'Android 11',
    lastSeen: '1 hour ago'
  },
  {
    id: '4',
    name: 'Google Pixel 6',
    model: 'GR5Y6',
    status: 'offline',
    battery: 12,
    connection: 'USB',
    imei: '356987401234570',
    bootloader: 'Locked',
    rom: 'Android 13',
    lastSeen: '2 hours ago'
  }
];

export default function ActiveDevices() {
  const [devices, setDevices] = useState(mockDevices);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.model.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Active Devices</h1>
          <p className="text-slate-400">Monitor all connected Android devices</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="form-card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by device name or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Devices</p>
              <p className="text-2xl font-bold text-white">{devices.length}</p>
            </div>
            <Smartphone className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Online</p>
              <p className="text-2xl font-bold text-green-400">{devices.filter(d => d.status === 'online').length}</p>
            </div>
            <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Busy</p>
              <p className="text-2xl font-bold text-yellow-400">{devices.filter(d => d.status === 'busy').length}</p>
            </div>
            <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Offline</p>
              <p className="text-2xl font-bold text-red-400">{devices.filter(d => d.status === 'offline').length}</p>
            </div>
            <div className="w-6 h-6 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredDevices.map((device) => (
          <div key={device.id} className="form-card hover:border-blue-500 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                  <Smartphone className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{device.name}</h3>
                  <p className="text-sm text-slate-400">{device.model}</p>
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
                <span className="text-sm text-slate-300">{device.battery}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Usb className="text-blue-400" size={18} />
                <span className="text-sm text-slate-300">{device.connection}</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 mb-4">
              <p>IMEI: {device.imei}</p>
              <p>Bootloader: {device.bootloader} | ROM: {device.rom}</p>
              <p>Last seen: {device.lastSeen}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link
                to={`/dashboard/device/${device.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
              >
                <Smartphone size={16} />
                View
              </Link>
              <Link
                to={`/dashboard/terminal/${device.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
              >
                <Terminal size={16} />
                Terminal
              </Link>
              <Link
                to={`/dashboard/partition/${device.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
              >
                <HardDrive size={16} />
                Partition
              </Link>
              <Link
                to={`/dashboard/logs/${device.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
              >
                <FileCode size={16} />
                Logs
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="form-card text-center py-12">
          <Smartphone className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-400">No devices found</p>
        </div>
      )}
    </div>
  );
}
