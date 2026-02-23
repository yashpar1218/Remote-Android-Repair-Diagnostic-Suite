import { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone
} from 'lucide-react';

// Mock users data
const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@rads.com', phone: '+1 234 567 8901', role: 'technician', status: 'active', joinedDate: '2024-01-15' },
  { id: '2', name: 'Jane Smith', email: 'jane@rads.com', phone: '+1 234 567 8902', role: 'technician', status: 'active', joinedDate: '2024-01-20' },
  { id: '3', name: 'Admin User', email: 'admin@rads.com', phone: '+1 234 567 8903', role: 'admin', status: 'active', joinedDate: '2024-01-01' },
  { id: '4', name: 'Mike Johnson', email: 'mike@rads.com', phone: '+1 234 567 8904', role: 'technician', status: 'inactive', joinedDate: '2024-02-01' },
  { id: '5', name: 'Sarah Wilson', email: 'sarah@rads.com', phone: '+1 234 567 8905', role: 'technician', status: 'active', joinedDate: '2024-02-10' },
];

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'bg-green-500/20 text-green-400' 
      : 'bg-red-500/20 text-red-400';
  };

  const getRoleColor = (role) => {
    return role === 'admin' 
      ? 'bg-purple-500/20 text-purple-400' 
      : 'bg-blue-500/20 text-blue-400';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400">Manage technicians and admin accounts</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
            <Users className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Technicians</p>
              <p className="text-2xl font-bold text-blue-400">{users.filter(u => u.role === 'technician').length}</p>
            </div>
            <Shield className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Admins</p>
              <p className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === 'admin').length}</p>
            </div>
            <Shield className="text-purple-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active</p>
              <p className="text-2xl font-bold text-green-400">{users.filter(u => u.status === 'active').length}</p>
            </div>
            <UserCheck className="text-green-400" size={24} />
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="technician">Technician</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="form-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">User</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Role</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Joined</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full bg-slate-600"
                      />
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {user.joinedDate}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                      >
                        <Edit size={18} />
                      </button>
                      <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="form-card text-center py-12">
          <Users className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-400">No users found</p>
        </div>
      )}
    </div>
  );
}
