import { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Terminal,
  HardDrive
} from 'lucide-react';

// Mock repair history data
const mockHistory = [
  {
    id: '1',
    deviceName: 'Samsung Galaxy S21',
    deviceModel: 'SM-G991B',
    issue: 'Battery drainage issue',
    status: 'completed',
    technician: 'John Doe',
    startDate: '2024-02-15 10:30',
    endDate: '2024-02-15 12:45',
    actions: ['Device inspection', 'Battery diagnostics', 'Software optimization'],
    cost: 45
  },
  {
    id: '2',
    deviceName: 'OnePlus 9 Pro',
    deviceModel: 'LE2123',
    issue: 'Bootloop after custom ROM',
    status: 'completed',
    technician: 'John Doe',
    startDate: '2024-02-14 14:00',
    endDate: '2024-02-14 16:30',
    actions: ['Factory reset', 'Stock firmware flash', 'Data backup'],
    cost: 75
  },
  {
    id: '3',
    deviceName: 'Xiaomi Mi 11',
    deviceModel: 'M2011K2G',
    issue: 'Screen not responding',
    status: 'in-progress',
    technician: 'Jane Smith',
    startDate: '2024-02-16 09:00',
    endDate: null,
    actions: ['Device inspection', 'Display diagnostics'],
    cost: 0
  },
  {
    id: '4',
    deviceName: 'Google Pixel 6',
    deviceModel: 'GR5Y6',
    issue: 'USB port not working',
    status: 'completed',
    technician: 'John Doe',
    startDate: '2024-02-13 11:00',
    endDate: '2024-02-13 13:00',
    actions: ['Hardware inspection', 'Port cleaning', 'Driver update'],
    cost: 35
  },
  {
    id: '5',
    deviceName: 'Samsung Galaxy A52',
    deviceModel: 'A525F',
    issue: 'Lost password',
    status: 'cancelled',
    technician: 'Jane Smith',
    startDate: '2024-02-12 15:00',
    endDate: '2024-02-12 15:30',
    actions: ['Initial consultation'],
    cost: 0
  },
  {
    id: '6',
    deviceName: 'Realme GT',
    deviceModel: 'RMX3363',
    issue: 'Overheating',
    status: 'completed',
    technician: 'John Doe',
    startDate: '2024-02-10 10:00',
    endDate: '2024-02-10 14:00',
    actions: ['Thermal paste replacement', 'Cleaning', 'Stress test'],
    cost: 55
  }
];

export default function RepairHistory() {
  const [history] = useState(mockHistory);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const filteredHistory = history.filter(record => {
    const matchesSearch = 
      record.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.issue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in-progress': return 'bg-blue-500/20 text-blue-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'in-progress': return <Clock size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const completedCount = history.filter(h => h.status === 'completed').length;
  const inProgressCount = history.filter(h => h.status === 'in-progress').length;
  const totalRevenue = history.filter(h => h.status === 'completed').reduce((acc, h) => acc + h.cost, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Repair History</h1>
          <p className="text-slate-400">View all past diagnostic sessions and repairs</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Repairs</p>
              <p className="text-2xl font-bold text-white">{history.length}</p>
            </div>
            <History className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-400">{completedCount}</p>
            </div>
            <CheckCircle className="text-green-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-blue-400">{inProgressCount}</p>
            </div>
            <Clock className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-yellow-400">${totalRevenue}</p>
            </div>
            <span className="text-yellow-400 text-2xl">$</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="form-card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by device or issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.map((record) => (
          <div 
            key={record.id} 
            className="form-card hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => setSelectedRecord(record)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                  <Smartphone className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{record.deviceName}</h3>
                  <p className="text-sm text-slate-400">{record.deviceModel}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusColor(record.status)}`}>
                {getStatusIcon(record.status)}
                {record.status.replace('-', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Issue</p>
                <p className="text-sm text-white">{record.issue}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Technician</p>
                <p className="text-sm text-white">{record.technician}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Started</p>
                <p className="text-sm text-white">{record.startDate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Cost</p>
                <p className="text-sm text-white">${record.cost}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {record.status === 'completed' && (
                  <span className="text-xs text-green-400">✓ Completed</span>
                )}
                {record.status === 'in-progress' && (
                  <span className="text-xs text-blue-400">⏳ In Progress</span>
                )}
                {record.status === 'cancelled' && (
                  <span className="text-xs text-red-400">✕ Cancelled</span>
                )}
              </div>
              <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm">
                <Eye size={16} />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="form-card text-center py-12">
          <History className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-400">No repair history found</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="form-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Repair Details</h2>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Device</p>
                  <p className="text-white font-medium">{selectedRecord.deviceName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Model</p>
                  <p className="text-white font-medium">{selectedRecord.deviceModel}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Issue</p>
                <p className="text-white">{selectedRecord.issue}</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">Actions Performed</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRecord.actions.map((action, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Start Time</p>
                  <p className="text-white">{selectedRecord.startDate}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">End Time</p>
                  <p className="text-white">{selectedRecord.endDate || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <span className="text-slate-400">Total Cost</span>
                <span className="text-2xl font-bold text-green-400">${selectedRecord.cost}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
