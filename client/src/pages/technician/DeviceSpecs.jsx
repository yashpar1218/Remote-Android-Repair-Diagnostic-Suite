import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Smartphone, 
  Battery, 
  Cpu, 
  HardDrive, 
  Camera, 
  Network,
  Lock,
  RefreshCw,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';

// Mock device data
const mockDeviceData = {
  id: '1',
  name: 'Samsung Galaxy S21',
  model: 'SM-G991B',
  manufacturer: 'Samsung',
  brand: 'Samsung',
  device: 'o1s',
  hardware: 'exynos2100',
  board: 'exynos2100',
  androidVersion: '13',
  securityPatch: '2024-01-01',
  buildNumber: 'RP1A.200720.012',
  bootloader: 'Locked',
  carrier: 'Unlocked',
  SIMStatus: 'Dual SIM',
  networkType: '5G',
  imei: '356987401234567',
  imei2: '356987401234568',
  serialNumber: 'R5CR12345ABC',
  batteryLevel: 85,
  batteryTemp: 28,
  batteryVoltage: 4200,
  charging: false,
  Cpu: {
    cores: 8,
    architecture: 'ARM64',
    frequencies: ['2.9 GHz', '2.8 GHz', '2.2 GHz', '1.9 GHz']
  },
  RAM: {
    total: '8 GB',
    available: '4.2 GB',
    used: '3.8 GB'
  },
  Storage: {
    total: '128 GB',
    available: '64 GB',
    used: '64 GB'
  },
  Display: {
    resolution: '2400 x 1080',
    density: '421 DPI',
    refreshRate: '120 Hz',
    size: '6.2 inches'
  },
  Cameras: [
    { type: 'Main', mp: '12 MP', aperture: 'f/1.8' },
    { type: 'Ultra Wide', mp: '12 MP', aperture: 'f/2.2' },
    { type: 'Telephoto', mp: '64 MP', aperture: 'f/2.0' },
    { type: 'Front', mp: '10 MP', aperture: 'f/2.2' }
  ],
  Sensors: [
    'Accelerometer', 'Gyroscope', 'Proximity', 'Compass', 
    'Barometer', 'Fingerprint', 'Face Recognition', 'NFC'
  ]
};

export default function DeviceSpecs() {
  const { deviceId } = useParams();
  const [device, setDevice] = useState(mockDeviceData);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const InfoRow = ({ icon: Icon, label, value, copy }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
      <div className="flex items-center gap-3">
        <Icon className="text-blue-400" size={18} />
        <span className="text-slate-400">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white font-medium">{value}</span>
        {copy && (
          <button
            onClick={() => copyToClipboard(value, copy)}
            className="text-slate-400 hover:text-white"
          >
            {copied === copy ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/dashboard/devices"
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Device Specifications</h1>
          <p className="text-slate-400">{device.name} - {device.model}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Device Info Card */}
      <div className="form-card mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center">
            <Smartphone className="text-blue-400" size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{device.name}</h2>
            <p className="text-slate-400">{device.manufacturer} {device.model}</p>
          </div>
          <div className="ml-auto text-right">
            <div className="flex items-center gap-2 mb-1">
              <Battery className="text-green-400" size={20} />
              <span className="text-2xl font-bold text-white">{device.batteryLevel}%</span>
            </div>
            <p className="text-xs text-slate-400">{device.batteryTemp}°C</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Android</p>
            <p className="text-white font-semibold">Android {device.androidVersion}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Security Patch</p>
            <p className="text-white font-semibold">{device.securityPatch}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Bootloader</p>
            <p className={`font-semibold ${device.bootloader === 'Locked' ? 'text-red-400' : 'text-green-400'}`}>
              {device.bootloader}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Network</p>
            <p className="text-white font-semibold">{device.networkType}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Identity */}
        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4">Device Identity</h3>
          <InfoRow icon={Lock} label="IMEI" value={device.imei} copy="imei" />
          <InfoRow icon={Smartphone} label="IMEI 2" value={device.imei2} copy="imei2" />
          <InfoRow icon={Lock} label="Serial Number" value={device.serialNumber} copy="serial" />
          <InfoRow icon={Lock} label="Build Number" value={device.buildNumber} copy="build" />
          <InfoRow icon={Network} label="SIM Status" value={device.SIMStatus} />
          <InfoRow icon={Network} label="Carrier" value={device.carrier} />
        </div>

        {/* Hardware Info */}
        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4">Hardware</h3>
          <InfoRow icon={Cpu} label="Cpu Cores" value={device.Cpu.cores} />
          <InfoRow icon={Cpu} label="Architecture" value={device.Cpu.architecture} />
          <InfoRow icon={Cpu} label="Cpu" value={device.Cpu.frequencies.join(', ')} />
          <InfoRow icon={Storage} label="RAM" value={device.RAM.total} />
          <InfoRow icon={Storage} label="Storage" value={device.Storage.total} />
          <InfoRow icon={Smartphone} label="Display" value={device.Display.size} />
        </div>

        {/* Storage Info */}
        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4">Storage & RAM</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">RAM Usage</span>
              <span className="text-white">{device.RAM.used} / {device.RAM.total}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '47%' }}></div>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Storage Usage</span>
              <span className="text-white">{device.Storage.used} / {device.Storage.total}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>
          </div>
        </div>

        {/* Cameras */}
        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4">Cameras</h3>
          <div className="space-y-3">
            {device.Cameras.map((camera, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div className="flex items-center gap-3">
                  <Camera className="text-purple-400" size={18} />
                  <span className="text-slate-300">{camera.type}</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-medium">{camera.mp}</span>
                  <span className="text-slate-400 text-sm ml-2">{camera.aperture}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sensors */}
        <div className="form-card lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Sensors</h3>
          <div className="flex flex-wrap gap-2">
            {device.Sensors.map((sensor, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300"
              >
                {sensor}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
