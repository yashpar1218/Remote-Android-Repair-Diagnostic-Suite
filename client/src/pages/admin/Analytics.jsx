import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Smartphone,
  Clock,
  CheckCircle,
  DollarSign,
  Loader2,
  Wrench
} from 'lucide-react';
import axios from 'axios';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    totalTickets: 0,
    resolvedTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    successRate: 0,
    avgRepairTime: 0,
    revenue: 0,
    technicians: [],
    brandDistribution: [],
    issueCategories: [],
    dailyStats: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const syncRepairsFromTickets = async () => {
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const res = await axios.post('http://localhost:5000/api/admin/repairs/sync-from-tickets');
      const n = res.data?.synced ?? res.data?.ticketCount ?? 0;
      setSyncMessage(`${res.data?.message || 'Done'} (${n} tickets)`);
    } catch (e) {
      setSyncMessage(e.response?.data?.error || e.message || 'Sync failed');
    } finally {
      setSyncLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/analytics?range=${timeRange}`);
      if (response.data) {
        setAnalyticsData(response.data);
      } else {
        setAnalyticsData(getDefaultData());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData(getDefaultData());
    }
    setLoading(false);
  };

  const getDefaultData = () => ({
    totalTickets: 0,
    resolvedTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    successRate: 0,
    avgRepairTime: 0,
    revenue: 0,
    technicians: [],
    brandDistribution: [
      { name: 'Samsung', repairs: 45 },
      { name: 'OnePlus', repairs: 20 },
      { name: 'Xiaomi', repairs: 15 },
      { name: 'Redmi', repairs: 10 },
      { name: 'Realme', repairs: 8 },
      { name: 'Other', repairs: 7 }
    ],
    issueCategories: [
      { name: 'Screen Issues', value: 25, color: '#3b82f6' },
      { name: 'Battery', value: 20, color: '#22c55e' },
      { name: 'Software', value: 30, color: '#a855f7' },
      { name: 'Hardware', value: 15, color: '#f59e0b' },
      { name: 'Other', value: 10, color: '#64748b' }
    ],
    dailyStats: []
  });

  const filterOptions = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: 'year', label: 'This Year' }
  ];

  const issueDistribution = analyticsData.issueCategories.length > 0 
    ? analyticsData.issueCategories 
    : getDefaultData().issueCategories;

  const deviceBrands = analyticsData.brandDistribution.length > 0 
    ? analyticsData.brandDistribution 
    : getDefaultData().brandDistribution;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-slate-400">Track performance and insights</p>
        </div>
        <div className="flex gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm ${
                timeRange === option.value 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-blue-400" size={32} />
        </div>
      ) : (
        <div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="form-card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Smartphone className="text-blue-400" size={24} />
                </div>
                <span className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp size={16} />
                  +12%
                </span>
              </div>
              <p className="text-slate-400 text-sm">Total Tickets</p>
              <p className="text-3xl font-bold text-white">{analyticsData.totalTickets}</p>
            </div>

            <div className="form-card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <CheckCircle className="text-green-400" size={24} />
                </div>
                <span className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp size={16} />
                  +8%
                </span>
              </div>
              <p className="text-slate-400 text-sm">Resolved Tickets</p>
              <p className="text-3xl font-bold text-white">{analyticsData.resolvedTickets}</p>
            </div>

            <div className="form-card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Clock className="text-purple-400" size={24} />
                </div>
                <span className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp size={16} />
                  +5%
                </span>
              </div>
              <p className="text-slate-400 text-sm">Avg. Resolution Time</p>
              <p className="text-3xl font-bold text-white">{analyticsData.avgRepairTime || 2.5} hrs</p>
            </div>

            <div className="form-card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <DollarSign className="text-yellow-400" size={24} />
                </div>
                <span className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp size={16} />
                  +15%
                </span>
              </div>
              <p className="text-slate-400 text-sm">Success Rate</p>
              <p className="text-3xl font-bold text-white">{analyticsData.successRate || 0}%</p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Repairs Trend */}
            <div className="form-card">
              <h3 className="text-lg font-semibold text-white mb-4">Ticket Trend</h3>
              {analyticsData.dailyStats && analyticsData.dailyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Total" />
                    <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="Resolved" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  No data available for this period
                </div>
              )}
            </div>

            {/* Issue Distribution */}
            <div className="form-card">
              <h3 className="text-lg font-semibold text-white mb-4">Issue Categories</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={issueDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {issueDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {issueDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-400 text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Brands */}
            <div className="form-card">
              <h3 className="text-lg font-semibold text-white mb-4">Device Brand Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deviceBrands} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="repairs" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Metrics */}
            <div className="form-card">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">First-Time Fix Rate</span>
                    <span className="text-white font-medium">{analyticsData.successRate || 78}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${analyticsData.successRate || 78}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Customer Satisfaction</span>
                    <span className="text-white font-medium">92%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Technician Utilization</span>
                    <span className="text-white font-medium">85%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Average Response Time</span>
                    <span className="text-white font-medium">15 min</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Technicians */}
          <div className="form-card mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Technician Performance</h3>
            {analyticsData.technicians && analyticsData.technicians.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Technician</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Repairs</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Success Rate</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Avg. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.technicians.map((tech, index) => (
                      <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-4">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-slate-400/20 text-slate-300' :
                            index === 2 ? 'bg-amber-600/20 text-amber-500' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white">{tech.name}</td>
                        <td className="py-3 px-4 text-slate-300">{tech.totalRepairs || tech.repairs || 0}</td>
                        <td className="py-3 px-4 text-green-400">{tech.completionRate || tech.successRate || 0}%</td>
                        <td className="py-3 px-4 text-slate-300">{tech.avgTime || '2.5 hrs'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                No technician data available
              </div>
            )}
          </div>

          <div className="form-card mt-6 border border-slate-600/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Wrench className="text-amber-400" size={22} />
                  Repair data maintenance
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Rebuilds repair history from support tickets (status, technician, costs). Run once after upgrades or if history looks wrong.
                </p>
              </div>
              <button
                type="button"
                onClick={syncRepairsFromTickets}
                disabled={syncLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg text-white font-medium shrink-0"
              >
                {syncLoading ? <Loader2 className="animate-spin" size={18} /> : <Wrench size={18} />}
                Sync repairs from tickets
              </button>
            </div>
            {syncMessage && (
              <p className={`mt-3 text-sm ${syncMessage.includes('failed') || syncMessage.includes('denied') || syncMessage.includes('Access') ? 'text-red-400' : 'text-green-400'}`}>
                {syncMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
