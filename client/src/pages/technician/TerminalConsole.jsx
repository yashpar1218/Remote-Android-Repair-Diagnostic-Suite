import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Send,
  Trash2,
  Copy,
  Download,
  Smartphone,
  Search,
  Usb,
  Loader2,
  RefreshCw,
  Paperclip,
  X
} from 'lucide-react';

const JAVA_API = 'http://localhost:8080';
const NODE_API = 'http://localhost:5000/api/audit';

const QUICK_COMMANDS = {
  adb: [
    { cmd: 'adb devices', desc: 'List connected devices' },
    { cmd: 'adb shell getprop', desc: 'Get device properties' },
    { cmd: 'adb shell dumpsys', desc: 'System service info' },
    { cmd: 'adb reboot', desc: 'Reboot device' },
    { cmd: 'adb reboot bootloader', desc: 'Reboot to bootloader' },
    { cmd: 'adb reboot recovery', desc: 'Reboot to recovery' },
    { cmd: 'adb shell pm list packages', desc: 'List installed apps' },
    { cmd: 'adb logcat -d', desc: 'Read current logcat dump' }
  ],
  fastboot: [
    { cmd: 'fastboot devices', desc: 'List fastboot devices' },
    { cmd: 'fastboot getvar product', desc: 'Read product name' },
    { cmd: 'fastboot getvar unlocked', desc: 'Check bootloader unlock state' },
    { cmd: 'fastboot getvar current-slot', desc: 'Read active slot' },
    { cmd: 'fastboot getvar all', desc: 'Read all exposed variables' },
    { cmd: 'fastboot reboot', desc: 'Reboot device from fastboot' },
    { cmd: 'fastboot reboot bootloader', desc: 'Restart fastboot/bootloader mode' },
    { cmd: 'fastboot continue', desc: 'Continue boot process' }
  ]
};

export default function TerminalConsole() {
  const { deviceId } = useParams();
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(deviceId || '');
  const [currentDevice, setCurrentDevice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [command, setCommand] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [output, setOutput] = useState([
    { type: 'info', text: 'RADS Terminal v1.0 - Live ADB Console' },
    { type: 'info', text: 'Waiting for a connected device...' }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [mode, setMode] = useState('adb');
  const terminalEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${JAVA_API}/api/adb/devices`);
      const data = await response.json();
      if (data.success) {
        const detailed = Array.isArray(data.deviceDetails) ? data.deviceDetails : [];
        if (detailed.length) {
          const deviceList = detailed
            .map((device) => {
              const id = device.id || device.deviceId || device.serial;
              if (!id) return null;
              const state = String(device.state || 'device').toLowerCase();
              const isOnline = state === 'device' || state.startsWith('fastboot');
              return {
                id,
                name: id,
                model: id,
                status: isOnline ? 'online' : 'offline',
                connection: device.connectionType === 'wifi' ? 'WiFi' : 'USB'
              };
            })
            .filter(Boolean);
          setDevices(deviceList);
        } else if (Array.isArray(data.devices)) {
          const deviceList = data.devices.map((id) => ({ id, name: id, model: id, status: 'online', connection: 'USB' }));
          setDevices(deviceList);
        } else {
          setDevices([]);
        }
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to connect to the Java ADB service on port 8080.');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevices(); }, []);

  const effectiveDeviceId = deviceId || selectedDeviceId;
  const filteredDevices = devices.filter((device) => device.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeQuickCommands = QUICK_COMMANDS[mode] || QUICK_COMMANDS.adb;
  const isFastboot = mode === 'fastboot';

  useEffect(() => {
    if (!effectiveDeviceId) return;
    const device = devices.find((item) => item.id === effectiveDeviceId) || { id: effectiveDeviceId, name: effectiveDeviceId, model: effectiveDeviceId, status: 'online', connection: 'USB' };
    setCurrentDevice(device);
    setOutput([
      { type: 'info', text: `RADS Terminal v1.0 - Live ${mode.toUpperCase()} Console` },
      { type: 'info', text: `Connected to: ${device.name}` },
      { type: 'info', text: `Ready for ${mode.toUpperCase()} commands...` }
    ]);
  }, [effectiveDeviceId, devices]);

  useEffect(() => {
    if (!effectiveDeviceId) return;
    setOutput([
      { type: 'info', text: `RADS Terminal v1.0 - Live ${mode.toUpperCase()} Console` },
      { type: 'info', text: `Connected to: ${currentDevice?.name || effectiveDeviceId}` },
      { type: 'info', text: `Quick commands switched to ${mode.toUpperCase()}.` }
    ]);
    setCommand('');
    setAttachedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [mode]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const logAudit = async (cmd, status) => {
    try {
      await axios.post(NODE_API, {
        user: user?.name || user?.email || 'Technician',
        action: 'Terminal Command',
        target: effectiveDeviceId || 'No Device',
        command: cmd,
        ip: 'localhost',
        status
      });
    } catch (auditError) {
      console.error('Failed to store audit log:', auditError);
    }
  };

  const formatAttachmentAuditText = (cmd) => {
    if (!attachedFiles.length) {
      return cmd;
    }

    const attachmentList = attachedFiles.map((file) => file.name).join(', ');
    return `${cmd} [files: ${attachmentList}]`;
  };

  const handleFileSelection = (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) {
      return;
    }

    setAttachedFiles(selected);
  };

  const removeAttachedFile = (fileIndex) => {
    setAttachedFiles((prev) => {
      const nextFiles = prev.filter((_, index) => index !== fileIndex);
      if (fileInputRef.current && !nextFiles.length) {
        fileInputRef.current.value = '';
      }
      return nextFiles;
    });
  };

  const executeCommand = async (cmd = command) => {
    if (!cmd.trim() || !effectiveDeviceId) return;

    const trimmedCommand = cmd.trim();
    const usingAttachments = isFastboot && attachedFiles.length > 0;
    setIsExecuting(true);
    setOutput((prev) => [
      ...prev,
      { type: 'system', text: `$ ${trimmedCommand}` },
      ...(usingAttachments ? [{ type: 'info', text: `Attached from PC: ${attachedFiles.map((file) => file.name).join(', ')}` }] : [])
    ]);

    try {
      let response;
      if (usingAttachments) {
        const formData = new FormData();
        formData.append('deviceId', effectiveDeviceId);
        formData.append('mode', mode);
        formData.append('command', trimmedCommand);
        attachedFiles.forEach((file) => formData.append('files', file));
        
        response = await axios.post(`${JAVA_API}/api/adb/execute-with-files`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 600000, // 10 minutes timeout for large ROM/system images (up to 10GB)
        });
      } else {
        response = await axios.post(`${JAVA_API}/api/adb/execute`, {
          deviceId: effectiveDeviceId,
          mode,
          command: trimmedCommand
        });
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Command failed');
      }
      
      // Display the actual output from the command
      const outputText = String(response.data.output || '').trim();
      if (outputText) {
        const lines = outputText.split(/\r?\n/);
        setOutput((prev) => [...prev, ...lines.map((line) => ({ type: 'success', text: line }))]);
      } else {
        setOutput((prev) => [...prev, { type: 'success', text: 'Command executed successfully (no output)' }]);
      }
      await logAudit(formatAttachmentAuditText(trimmedCommand), 'success');
    } catch (err) {
      // Enhanced error handling for network and upload errors
      let errorMessage;
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Request timeout: File upload took too long. Try with smaller files or check your connection.';
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = `Network error: Cannot connect to Java ADB service at ${JAVA_API}. 
Make sure the service is running on port 8080.
If uploading large files, this could be a file size limit issue.`;
      } else if (err.response?.status === 413) {
        errorMessage = 'File too large: The uploaded file exceeds the server limit. Try a smaller file.';
      } else if (err.response?.status === 500) {
        errorMessage = err.response?.data?.error || 'Server error: Check Java service logs for details.';
      } else {
        errorMessage = err.response?.data?.error || err.message || 'Command failed';
      }
      
      // Split multi-line error messages
      const errorLines = errorMessage.split(/\r?\n/).filter(Boolean);
      if (errorLines.length > 1) {
        setOutput((prev) => [...prev, ...errorLines.map((line) => ({ type: 'error', text: line }))]);
      } else {
        setOutput((prev) => [...prev, { type: 'error', text: errorMessage }]);
      }
      await logAudit(formatAttachmentAuditText(trimmedCommand), 'error');
    } finally {
      setIsExecuting(false);
      setCommand('');
      setAttachedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearTerminal = () => {
    setOutput([
      { type: 'info', text: 'Terminal cleared' },
      { type: 'info', text: currentDevice ? `Connected to: ${currentDevice.name}` : 'No device selected' },
      { type: 'info', text: `Mode: ${mode.toUpperCase()}` }
    ]);
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output.map((line) => line.text).join('\n'));
  };

  const downloadOutput = () => {
    const text = output.map((line) => line.text).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mode}_terminal_output.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getOutputColor = (type) => ({
    error: 'text-red-400',
    warning: 'text-yellow-400',
    success: 'text-green-400',
    info: 'text-blue-400',
    system: 'text-purple-400'
  }[type] || 'text-slate-300');

  if (!effectiveDeviceId) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Terminal Console</h1>
            <p className="text-slate-400">Select a connected device to open the live terminal</p>
          </div>
          <button onClick={fetchDevices} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">{error}</div>}

        <div className="form-card mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="      Search by device ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input pl-10" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-blue-400" size={48} /><span className="ml-3 text-slate-400">Connecting to ADB service...</span></div>
        ) : filteredDevices.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredDevices.map((device) => (
              <button key={device.id} onClick={() => setSelectedDeviceId(device.id)} className="form-card hover:border-blue-500 transition-colors text-left">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center"><Smartphone className="text-blue-400" size={24} /></div>
                    <div><h3 className="font-semibold text-white">{device.name}</h3><p className="text-sm text-slate-400">{device.model}</p></div>
                  </div>
                  <span className="text-xs rounded-full bg-green-500/20 px-3 py-1 text-green-400">online</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300"><Usb className="text-blue-400" size={18} />{device.connection}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="form-card text-center py-12"><Smartphone className="mx-auto text-slate-600 mb-4" size={48} /><p className="text-slate-400">No devices found. Connect a device via USB and refresh.</p></div>
        )}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setSelectedDeviceId('')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Terminal Console</h1>
          <p className="text-slate-400">{currentDevice?.name || effectiveDeviceId}</p>
        </div>
        <button onClick={fetchDevices} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh Devices
        </button>
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button onClick={() => setMode('adb')} className={`px-4 py-2 rounded-md text-sm transition-colors ${mode === 'adb' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>ADB</button>
          <button onClick={() => setMode('fastboot')} className={`px-4 py-2 rounded-md text-sm transition-colors ${mode === 'fastboot' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Fastboot</button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="w-64 flex-shrink-0 form-card overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-1">Quick Commands</h3>
          <p className="text-xs text-slate-400 mb-3">{mode.toUpperCase()} command shortcuts</p>
          <div className="space-y-2">
            {activeQuickCommands.map((item) => (
              <button key={item.cmd} onClick={() => executeCommand(item.cmd)} disabled={isExecuting} className="w-full text-left p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-60">
                <code className="text-blue-400 text-xs">{item.cmd}</code>
                <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 terminal mb-4 overflow-y-auto bg-slate-900 p-4 rounded-lg">
            {output.map((line, index) => <div key={`${index}-${line.text}`} className={`${getOutputColor(line.type)} mb-1 font-mono text-sm whitespace-pre-wrap`}>{line.text}</div>)}
            <div ref={terminalEndRef} />
          </div>

          {isFastboot && (
            <div className="mb-3 rounded-lg border border-slate-700 bg-slate-800/80 p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">PC File Attachments</p>
                  <p className="text-xs text-slate-400">Attach images or zips for fastboot. Files are appended to the command automatically, or use placeholders like <code className="text-blue-400">{`{file1}`}</code>.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileSelection} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isExecuting} className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-60">
                    <Paperclip size={16} />
                    Attach Files
                  </button>
                  {!!attachedFiles.length && (
                    <button onClick={() => { setAttachedFiles([]); if (fileInputRef.current) fileInputRef.current.value = ''; }} disabled={isExecuting} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:text-white disabled:opacity-60">
                      Clear Files
                    </button>
                  )}
                </div>
              </div>

              {!!attachedFiles.length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-200">
                      <span>{`file${index + 1}: ${file.name}`}</span>
                      <button onClick={() => removeAttachedFile(index)} disabled={isExecuting} className="text-slate-400 hover:text-white disabled:opacity-60" title={`Remove ${file.name}`}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg"><span className="text-purple-400">$</span><span className="text-blue-400 text-sm">{mode}</span></div>
            <input type="text" value={command} onChange={(e) => setCommand(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeCommand()} placeholder={isFastboot ? 'Enter fastboot command, e.g. fastboot flash boot {file1}' : `Enter ${mode} command...`} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            <button onClick={() => executeCommand()} disabled={!command.trim() || isExecuting} className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white">{isExecuting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}</button>
            <button onClick={clearTerminal} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white" title="Clear"><Trash2 size={20} /></button>
            <button onClick={copyOutput} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white" title="Copy"><Copy size={20} /></button>
            <button onClick={downloadOutput} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white" title="Download"><Download size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}


