import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Smartphone,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Activity
} from 'lucide-react';
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

// Mock analytics data
const repairStats = [
  { name: 'Mon', repairs: 12, success: 10 },
  { name: 'Tue', repairs: 15, success: 13 },
  { name: 'Wed', repairs: 18, success: 16 },
  { name: 'Thu', repairs: 14, success: 12 },
  { name: 'Fri', repairs: 20, success: 18 },
  { name: 'Sat', repairs: 25, success: 22 },
  { name: 'Sun', repairs: 10, success: 9 },
];

const issueDistribution = [
  { name: 'Screen Issues', value: 25, color: '#3b82f6' },
  { name: 'Battery', value: 20, color: '#22c55e' },
  { name: 'Software', value: 30, color: '#a855f7' },
  { name: 'Hardware', value: 15, color: '#f59e0b' },
  { name: 'Other', value: 10, color: '#64748b' },
];

const deviceBrands = [
  { name: 'Samsung', repairs: 45 },
  { name: 'OnePlus', repairs: 20 },
  { name: 'Xiaomi', repairs: 15 },
  { name: 'Google', repairs: 10 },
  { name: 'Other', repairs: 10 },
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('week');

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-slate-400">Track performance and insights</p>
        </div>
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm capitalize ${
                timeRange === range 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

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
          <p className="text-slate-400 text-sm">Total Repairs</p>
          <p className="text-3xl font-bold text-white">1,234</p>
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
          <p className="text-slate-400 text-sm">Success Rate</p>
          <p className="text-3xl font-bold text-white">94.5%</p>
        </div>

        <div className="form-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Clock className="text-purple-400" size={24} />
            </div>
            <span className="flex items-center gap-1 text-red-400 text-sm">
              <TrendingDown size={16} />
              -5%
            </span>
          </div>
          <p className="text-slate-400 text-sm">Avg. Repair Time</p>
          <p className="text-3xl font-bold text-white">2.5 hrs</p>
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
          <p className="text-slate-400 text-sm">Revenue</p>
          <p className="text-3xl font-bold text-white">$45,678</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Repairs Trend */}
        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Repairs Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={repairStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="repairs" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              <Line type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Distribution */}
        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4">Issue Distribution</h3>
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
          <h3 className="text-lg font-semibold text-white mb-4">Repairs by Brand</h3>
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
                <span className="text-white font-medium">78%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
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
        <h3 className="text-lg font-semibold text-white mb-4">Top Performing Technicians</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Rank</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Technician</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Repairs</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Success Rate</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Avg. Time</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {[
                { rank: 1, name: 'John Doe', repairs: 156, success: 98, time: '2.1 hrs', rating: 4.9 },
                { rank: 2, name: 'Jane Smith', repairs: 142, success: 96, time: '2.3 hrs', rating: 4.8 },
                { rank: 3, name: 'Mike Johnson', repairs: 128, success: 94, time: '2.5 hrs', rating: 4.7 },
                { rank: 4, name: 'Sarah Wilson', repairs: 115, success: 92, time: '2.8 hrs', rating: 4.6 },
                { rank: 5, name: 'Tom Brown', repairs: 98, success: 90, time: '3.0 hrs', rating: 4.5 },
              ].map((tech) => (
                <tr key={tech.rank} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      tech.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      tech.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                      tech.rank === 3 ? 'bg-amber-600/20 text-amber-500' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {tech.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white">{tech.name}</td>
                  <td className="py-3 px-4 text-slate-300">{tech.repairs}</td>
                  <td className="py-3 px-4 text-green-400">{tech.success}%</td>
                  <td className="py-3 px-4 text-slate-300">{tech.time}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-yellow-400">
                      <span>★</span> {tech.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
