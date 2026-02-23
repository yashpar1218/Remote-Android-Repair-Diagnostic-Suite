import { useState } from 'react';
import { 
  Activity, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  Loader2,
  Terminal,
  AlertTriangle
} from 'lucide-react';

// Mock repair stages
const repairStages = [
  { id: 1, name: 'Initial Diagnosis', status: 'completed', time: '10:30 AM' },
  { id: 2, name: 'Device Analysis', status: 'completed', time: '10:45 AM' },
  { id: 3, name: 'Software Check', status: 'in-progress', time: '11:00 AM' },
  { id: 4, name: 'Data Backup', status: 'pending', time: '-' },
  { id: 5, name: 'Repair Process', status: 'pending', time: '-' },
  { id: 6, name: 'Final Testing', status: 'pending', time: '-' },
  { id: 7, name: 'Completion', status: 'pending', time: '-' },
];

export default function LiveStatus() {
  const [progress] = useState(35);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in-progress': return 'text-blue-400';
      case 'pending': return 'text-slate-500';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={20} />;
      case 'in-progress': return <Loader2 size={20} className="animate-spin" />;
      case 'pending': return <Clock size={20} />;
      default: return <Clock size={20} />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Live Repair Status</h1>
        <p className="text-slate-400">Track the progress of your device repair in real-time</p>
      </div>

      {/* Device Info */}
      <div className="form-card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center">
            <Smartphone className="text-blue-400" size={32} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">Samsung Galaxy S21</h2>
            <p className="text-slate-400">Model: SM-G991B | Issue: Battery drainage</p>
            <p className="text-slate-500 text-sm">Request ID: #RADS-ABC123XY</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">{progress}%</div>
            <p className="text-slate-400 text-sm">Complete</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="form-card mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Overall Progress</h3>
        <div className="w-full bg-slate-700 rounded-full h-4 mb-4">
          <div 
            className="bg-blue-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-slate-400">
          <span>Started: 10:30 AM</span>
          <span>Est. Completion: 2:00 PM</span>
        </div>
      </div>

      {/* Repair Stages */}
      <div className="form-card">
        <h3 className="text-lg font-semibold text-white mb-4">Repair Stages</h3>
        <div className="space-y-4">
          {repairStages.map((stage, index) => (
            <div 
              key={stage.id} 
              className={`flex items-center gap-4 p-4 rounded-lg ${
                stage.status === 'in-progress' ? 'bg-blue-500/10 border border-blue-500/30' :
                stage.status === 'completed' ? 'bg-green-500/10 border border-green-500/30' :
                'bg-slate-700/30'
              }`}
            >
              <div className={`${getStatusColor(stage.status)}`}>
                {getStatusIcon(stage.status)}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${
                  stage.status === 'pending' ? 'text-slate-500' : 'text-white'
                }`}>
                  {stage.name}
                </h4>
                {stage.status === 'in-progress' && (
                  <p className="text-blue-400 text-sm">Currently running...</p>
                )}
              </div>
              <div className="text-right">
                <span className={`text-sm ${getStatusColor(stage.status)}`}>
                  {stage.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Action */}
      <div className="form-card mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Action</h3>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="text-blue-400 animate-spin" size={20} />
            <span className="text-blue-400 font-medium">Running Diagnostics</span>
          </div>
          <p className="text-slate-400 text-sm">
            Technicians are analyzing system logs and checking for any underlying issues. This may take a few minutes.
          </p>
        </div>
      </div>

      {/* Technician Info */}
      <div className="form-card mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Assigned Technician</h3>
        <div className="flex items-center gap-4">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=john" 
            alt="Technician" 
            className="w-12 h-12 rounded-full bg-slate-600"
          />
          <div>
            <p className="text-white font-medium">John Doe</p>
            <p className="text-slate-400 text-sm">Senior Android Technician</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-400 text-sm">Online</span>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-yellow-400 text-sm">
            <p className="font-medium">Important</p>
            <p className="text-yellow-400/70">Please keep your device connected to the computer and avoid disconnecting until the repair is complete.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
