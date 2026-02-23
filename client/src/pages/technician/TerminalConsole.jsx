import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Terminal as TerminalIcon, 
  ArrowLeft, 
  Send, 
  Trash2, 
  Copy, 
  Download,
  Play,
  Square,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Mock device info
const mockDevice = {
  id: '1',
  name: 'Samsung Galaxy S21',
  model: 'SM-G991B'
};

// Common ADB commands
const quickCommands = [
  { cmd: 'adb devices', desc: 'List connected devices' },
  { cmd: 'adb shell getprop', desc: 'Get device properties' },
  { cmd: 'adb shell dumpsys', desc: 'System service info' },
  { cmd: 'adb reboot', desc: 'Reboot device' },
  { cmd: 'adb reboot bootloader', desc: 'Reboot to bootloader' },
  { cmd: 'adb reboot recovery', desc: 'Reboot to recovery' },
  { cmd: 'adb install', desc: 'Install APK' },
  { cmd: 'adb uninstall', desc: 'Uninstall app' },
  { cmd: 'adb shell pm list packages', desc: 'List installed apps' },
  { cmd: 'adb pull', desc: 'Pull file from device' },
  { cmd: 'adb push', desc: 'Push file to device' },
  { cmd: 'adb logcat', desc: 'View logcat' },
];

export default function TerminalConsole() {
  const { deviceId } = useParams();
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([
    { type: 'info', text: 'RADS Terminal v1.0 - ADB Console' },
    { type: 'info', text: 'Connected to: Samsung Galaxy S21 (SM-G991B)' },
    { type: 'info', text: 'Ready for commands...' },
    { type: 'system', text: '$ adb devices' },
    { type: 'success', text: 'List of devices attached' },
    { type: 'success', text: 'emulator-5554    device' },
    { type: 'success', text: '356987401234567    device' },
    { type: 'system', text: '$ adb shell getprop ro.build.version.sdk' },
    { type: 'success', text: '33' },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [mode, setMode] = useState('adb'); // adb or fastboot
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const executeCommand = (cmd = command) => {
    if (!cmd.trim()) return;
    
    setIsExecuting(true);
    
    // Add command to output
    setOutput(prev => [...prev, { type: 'system', text: `$ ${cmd}` }]);
    
    // Simulate command execution
    setTimeout(() => {
      let response = [];
      
      if (cmd.includes('devices')) {
        response = [
          { type: 'success', text: 'List of devices attached' },
          { type: 'success', text: '356987401234567    device' },
        ];
      } else if (cmd.includes('getprop')) {
        response = [
          { type: 'info', text: '[ro.build.version.sdk]: [33]' },
          { type: 'info', text: '[ro.build.version.release]: [13]' },
          { type: 'info', text: '[ro.product.model]: [SM-G991B]' },
          { type: 'info', text: '[ro.product.brand]: [samsung]' },
        ];
      } else if (cmd.includes('reboot')) {
        response = [{ type: 'warning', text: 'Reboot command sent. Device will restart.' }];
      } else if (cmd.includes('shell')) {
        response = [
          { type: 'success', text: 'shell@o1s:/ $ ' },
        ];
      } else {
        response = [{ type: 'info', text: 'Command executed successfully' }];
      }
      
      setOutput(prev => [...prev, ...response]);
      setIsExecuting(false);
    }, 500);
    
    setCommand('');
  };

  const quickCommand = (cmd) => {
    setCommand(cmd);
    executeCommand(cmd);
  };

  const clearTerminal = () => {
    setOutput([
      { type: 'info', text: 'Terminal cleared' },
      { type: 'system', text: '$ ' },
    ]);
  };

  const copyOutput = () => {
    const text = output.map(o => o.text).join('\n');
    navigator.clipboard.writeText(text);
  };

  const downloadOutput = () => {
    const text = output.map(o => o.text).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terminal_output.txt';
    a.click();
  };

  const getOutputColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400';
      case 'system': return 'text-purple-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          to="/dashboard/devices"
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Terminal Console</h1>
          <p className="text-slate-400">{mockDevice.name} - {mockDevice.model}</p>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setMode('adb')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              mode === 'adb' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ADB
          </button>
          <button
            onClick={() => setMode('fastboot')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              mode === 'fastboot' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fastboot
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Quick Commands Sidebar */}
        <div className="w-64 flex-shrink-0 form-card overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-3">Quick Commands</h3>
          <div className="space-y-2">
            {quickCommands.map((item, index) => (
              <button
                key={index}
                onClick={() => quickCommand(item.cmd)}
                disabled={isExecuting}
                className="w-full text-left p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm transition-colors"
              >
                <code className="text-blue-400 text-xs">{item.cmd}</code>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Terminal */}
        <div className="flex-1 flex flex-col">
          {/* Terminal Output */}
          <div className="flex-1 terminal mb-4 overflow-y-auto">
            {output.map((line, index) => (
              <div key={index} className={`${getOutputColor(line.type)} mb-1`}>
                {line.text}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Command Input */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
              <span className="text-purple-400">$</span>
              <select
                className="bg-transparent text-blue-400 text-sm focus:outline-none"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="adb">adb</option>
                <option value="fastboot">fastboot</option>
              </select>
            </div>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
              placeholder="Enter command..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => executeCommand()}
              disabled={!command.trim() || isExecuting}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
            >
              <Send size={20} />
            </button>
            <button
              onClick={clearTerminal}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
              title="Clear"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={copyOutput}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
              title="Copy"
            >
              <Copy size={20} />
            </button>
            <button
              onClick={downloadOutput}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
              title="Download"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
