import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  HardDrive, 
  ArrowLeft, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Database,
  Server,
  Download,
  Upload
} from 'lucide-react';

// Mock partition data
const mockPartitions = [
  {
    name: '/system',
    mount: '/system',
    type: 'ext4',
    size: '4.2 GB',
    used: '3.8 GB',
    available: '400 MB',
    usage: 90,
    status: 'critical',
    readOnly: true
  },
  {
    name: '/data',
    mount: '/data',
    type: 'ext4',
    size: '64 GB',
    used: '48 GB',
    available: '16 GB',
    usage: 75,
    status: 'warning',
    readOnly: false
  },
  {
    name: '/vendor',
    mount: '/vendor',
    type: 'ext4',
    size: '2.1 GB',
    used: '1.8 GB',
    available: '300 MB',
    usage: 85,
    status: 'warning',
    readOnly: true
  },
  {
    name: '/storage',
    mount: '/storage/emulated/0',
    type: 'f2fs',
    size: '56 GB',
    used: '32 GB',
    available: '24 GB',
    usage: 57,
    status: 'good',
    readOnly: false
  },
  {
    name: '/cache',
    mount: '/cache',
    type: 'ext4',
    size: '512 MB',
    used: '128 MB',
    available: '384 MB',
    usage: 25,
    status: 'good',
    readOnly: false
  },
  {
    name: '/boot',
    mount: '/boot',
    type: 'ext4',
    size: '32 MB',
    used: '28 MB',
    available: '4 MB',
    usage: 87,
    status: 'warning',
    readOnly: true
  },
  {
    name: '/recovery',
    mount: '/recovery',
    type: 'ext4',
    size: '64 MB',
    used: '48 MB',
    available: '16 MB',
    usage: 75,
    status: 'warning',
    readOnly: true
  },
  {
    name: '/efs',
    mount: '/efs',
    type: 'ext4',
    size: '8 MB',
    used: '2 MB',
    available: '6 MB',
    usage: 25,
    status: 'good',
    readOnly: true
  }
];

export default function PartitionHealth() {
  const { deviceId } = useParams();
  const [partitions, setPartitions] = useState(mockPartitions);
  const [loading, setLoading] = useState(false);
  const [selectedPartition, setSelectedPartition] = useState(null);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical': return <XCircle className="text-red-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      default: return <CheckCircle className="text-green-500" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getUsageColor = (usage) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const criticalCount = partitions.filter(p => p.status === 'critical').length;
  const warningCount = partitions.filter(p => p.status === 'warning').length;
  const goodCount = partitions.filter(p => p.status === 'good').length;

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
          <h1 className="text-2xl font-bold text-white">Partition Health Manager</h1>
          <p className="text-slate-400">Samsung Galaxy S21 - SM-G991B</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Scan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Partitions</p>
              <p className="text-2xl font-bold text-white">{partitions.length}</p>
            </div>
            <Database className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Critical</p>
              <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
            </div>
            <XCircle className="text-red-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Warning</p>
              <p className="text-2xl font-bold text-yellow-400">{warningCount}</p>
            </div>
            <AlertTriangle className="text-yellow-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Healthy</p>
              <p className="text-2xl font-bold text-green-400">{goodCount}</p>
            </div>
            <CheckCircle className="text-green-400" size={24} />
          </div>
        </div>
      </div>

      {/* Partition List */}
      <div className="form-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Partitions</h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Partition</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Mount</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Size</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Usage</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">RO</th>
              </tr>
            </thead>
            <tbody>
              {partitions.map((partition, index) => (
                <tr 
                  key={index} 
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer"
                  onClick={() => setSelectedPartition(partition)}
                >
                  <td className="py-3 px-4">
                    {getStatusIcon(partition.status)}
                  </td>
                  <td className="py-3 px-4 text-white font-mono text-sm">{partition.name}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-sm">{partition.mount}</td>
                  <td className="py-3 px-4 text-slate-300">{partition.type}</td>
                  <td className="py-3 px-4 text-slate-300">{partition.size}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getUsageColor(partition.usage)}`} 
                          style={{ width: `${partition.usage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-300">{partition.usage}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {partition.readOnly ? (
                      <span className="text-red-400 text-sm">Yes</span>
                    ) : (
                      <span className="text-green-400 text-sm">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Partition Details */}
      {selectedPartition && (
        <div className="form-card mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedPartition.name} Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Used Space</p>
              <p className="text-xl font-bold text-white">{selectedPartition.used}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Available Space</p>
              <p className="text-xl font-bold text-white">{selectedPartition.available}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">File System</p>
              <p className="text-xl font-bold text-white">{selectedPartition.type}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Status</p>
              <p className={`text-xl font-bold ${
                selectedPartition.status === 'critical' ? 'text-red-400' :
                selectedPartition.status === 'warning' ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {selectedPartition.status.toUpperCase()}
              </p>
            </div>
          </div>
          
          {selectedPartition.status !== 'good' && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle size={20} />
                <span className="font-semibold">Recommendations</span>
              </div>
              <ul className="text-sm text-slate-300 space-y-1">
                {selectedPartition.status === 'critical' && (
                  <>
                    <li>• Immediate action required: Partition is critically low on space</li>
                    <li>• Clear cache and unnecessary files immediately</li>
                    <li>• Consider factory reset if space cannot be reclaimed</li>
                  </>
                )}
                {selectedPartition.status === 'warning' && (
                  <>
                    <li>• Partition usage is above recommended threshold</li>
                    <li>• Review and remove unnecessary files</li>
                    <li>• Schedule regular cleanup</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
