import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';
import DeviceSelectionGrid from '../../components/technician/DeviceSelectionGrid';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000';
const JAVA_API = 'http://localhost:8080';

const sizeToBytes = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  const match = normalized.match(/([\d.]+)\s*([KMGTPE]?)(I?B)?/);
  if (!match) return 0;

  const amount = parseFloat(match[1]);
  if (!Number.isFinite(amount)) return 0;

  const unit = match[2] || '';
  const multipliers = {
    '': 1,
    K: 1024,
    M: 1024 ** 2,
    G: 1024 ** 3,
    T: 1024 ** 4,
    P: 1024 ** 5,
    E: 1024 ** 6
  };

  return Math.round(amount * (multipliers[unit] || 1));
};

export default function PartitionHealth() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const technicianName = user?.name || 'Technician';
  const [partitionOutput, setPartitionOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedPartitions, setParsedPartitions] = useState([]);

  const parsePartitions = (output) => {
    if (!output) {
      setParsedPartitions([]);
      return [];
    }

    const lines = output.split('\n').filter((line) => line.trim() && !line.startsWith('Filesystem'));
    const partitions = lines
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 6) return null;

        const usage = parseInt(parts[4].replace('%', ''), 10);
        let status = 'healthy';
        if (usage >= 90) status = 'critical';
        else if (usage >= 75) status = 'warning';

        return {
          filesystem: parts[0],
          size: parts[1],
          used: parts[2],
          available: parts[3],
          usage: Number.isFinite(usage) ? usage : 0,
          mounted: parts[5] || parts[4],
          status,
          sizeBytes: sizeToBytes(parts[1]),
          usedBytes: sizeToBytes(parts[2]),
          availableBytes: sizeToBytes(parts[3])
        };
      })
      .filter(Boolean);

    setParsedPartitions(partitions);
    return partitions;
  };

  const syncPartitions = async (partitions) => {
    if (!deviceId || !partitions.length) return;
    const response = await fetch(`${API_URL}/api/partitions/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: deviceId,
        technician_name: technicianName,
        partitions: partitions.map((partition) => ({
          partitionName: partition.filesystem,
          partitionType: 'filesystem',
          size: partition.sizeBytes,
          usedSpace: partition.usedBytes,
          freeSpace: partition.availableBytes,
          fileSystem: partition.filesystem,
          mountPoint: partition.mounted,
          status: partition.status
        }))
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Failed to store partition snapshot');
    }
  };

  const fetchPartitions = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${JAVA_API}/api/adb/partitions/${deviceId}`);
      const data = await response.json();

      if (data.success) {
        const rawOutput = data.partitions || '';
        const partitions = parsePartitions(rawOutput);
        setPartitionOutput(rawOutput);
        await syncPartitions(partitions);
      } else {
        setError(data.error || 'Failed to fetch partitions');
      }
    } catch (err) {
      console.error('Error fetching partitions:', err);
      setError(err.message || 'Failed to connect to backend services for partition scan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartitions();
  }, [deviceId]);

  if (!deviceId) {
    return (
      <DeviceSelectionGrid
        title="Partition Health"
        description="Choose a connected device to inspect partition usage."
        buildPath={(selectedId) => `/dashboard/partition/${selectedId}`}
      />
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getUsageColor = (usage) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical': return <AlertCircle className="text-red-500" size={20} />;
      case 'warning': return <AlertCircle className="text-yellow-500" size={20} />;
      default: return <span className="text-green-500">OK</span>;
    }
  };

  const downloadPartitions = () => {
    const blob = new Blob([partitionOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `partitions_${deviceId}_${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const criticalCount = parsedPartitions.filter((partition) => partition.status === 'critical').length;
  const warningCount = parsedPartitions.filter((partition) => partition.status === 'warning').length;
  const healthyCount = parsedPartitions.filter((partition) => partition.status === 'healthy').length;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard/partition')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Partition Health</h1>
          <p className="text-slate-400">Device ID: {deviceId}</p>
        </div>
        <button onClick={fetchPartitions} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white disabled:opacity-50">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading...' : 'Scan'}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <Link to={`/dashboard/specs/${deviceId}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm">Device Specs</Link>
        <Link to={`/dashboard/logs/${deviceId}`} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm">View Logs</Link>

      </div>

      {error && !partitionOutput && (
        <div className="form-card mb-6">
          <div className="flex items-center gap-4 text-red-400">
            <AlertCircle size={24} />
            <div>
              <h3 className="font-semibold">Error Fetching Partitions</h3>
              <p className="text-sm text-slate-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading && !partitionOutput ? (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-300">
          <Loader2 className="animate-spin text-blue-400" size={48} />
          Fetching partition information...
        </div>
      ) : (
        <>
          {parsedPartitions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="form-card"><p className="text-slate-400 text-sm">Total Partitions</p><p className="text-2xl font-bold text-white">{parsedPartitions.length}</p></div>
              <div className="form-card"><p className="text-slate-400 text-sm">Critical</p><p className="text-2xl font-bold text-red-400">{criticalCount}</p></div>
              <div className="form-card"><p className="text-slate-400 text-sm">Warning</p><p className="text-2xl font-bold text-yellow-400">{warningCount}</p></div>
              <div className="form-card"><p className="text-slate-400 text-sm">Healthy</p><p className="text-2xl font-bold text-green-400">{healthyCount}</p></div>
            </div>
          )}

          {parsedPartitions.length > 0 && (
            <div className="form-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Partitions</h3>
                <button onClick={downloadPartitions} className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white">
                  <Download size={16} />
                  Export
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Filesystem</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Size</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Used</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Available</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Usage</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Mounted On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPartitions.map((partition, index) => (
                      <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-4">{getStatusIcon(partition.status)}</td>
                        <td className="py-3 px-4 text-white font-mono text-sm">{partition.filesystem}</td>
                        <td className="py-3 px-4 text-slate-300">{partition.size}</td>
                        <td className="py-3 px-4 text-slate-300">{partition.used}</td>
                        <td className="py-3 px-4 text-slate-300">{partition.available}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-700 rounded-full h-2">
                              <div className={`h-2 rounded-full ${getUsageColor(partition.usage)}`} style={{ width: `${partition.usage}%` }} />
                            </div>
                            <span className={`text-sm ${getStatusColor(partition.status)}`}>{partition.usage}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono text-sm">{partition.mounted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="form-card mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Raw Output</h3>
            <div className="bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-green-400 font-mono whitespace-pre">{partitionOutput || 'No data available'}</pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

