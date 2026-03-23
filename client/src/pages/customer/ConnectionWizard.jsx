import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  Cable,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  RefreshCw,
  Terminal,
  Usb,
  WifiOff
} from 'lucide-react';

const API_URL = 'http://localhost:5000';
const JAVA_API = 'http://localhost:8080';
const SUPPORT_DEVICE_KEY = 'radsSelectedSupportDevice';

export default function ConnectionWizard() {
  const { ticketId: routeTicketId } = useParams();
  const [searchParams] = useSearchParams();
  const ticketId = routeTicketId || searchParams.get('ticket');
  const requestedDeviceId = searchParams.get('device');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(requestedDeviceId || '');
  const [connectionStatus, setConnectionStatus] = useState({
    usbConnected: false,
    usbDebuggingEnabled: false,
    authorizationPending: false,
    connectedDevice: null,
    properties: null,
    message: 'Checking USB connection...'
  });

  useEffect(() => {
    const savedDevice = JSON.parse(localStorage.getItem(SUPPORT_DEVICE_KEY) || 'null');
    if (savedDevice && !requestedDeviceId) {
      setSelectedDevice(savedDevice);
      setSelectedDeviceId(savedDevice.id || '');
    }
  }, [requestedDeviceId]);

  useEffect(() => {
    const fetchTicketData = async () => {
      if (!ticketId) return;

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/tickets/${ticketId}`);
        const ticket = response.data;
        setTicketData(ticket);
        if (!requestedDeviceId && ticket.device_id) {
          setSelectedDeviceId(ticket.device_id);
        }
      } catch (err) {
        console.error('Error fetching ticket:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [ticketId, requestedDeviceId]);

  useEffect(() => {
    const fetchSelectedDevice = async () => {
      if (!selectedDeviceId) return;

      try {
        const response = await axios.get(`${API_URL}/api/devices`);
        const matchedDevice = (response.data || []).find((device) => device._id === selectedDeviceId);
        if (matchedDevice) {
          const normalized = {
            id: matchedDevice._id,
            name: matchedDevice.name || '',
            brand: matchedDevice.brand || '',
            model: matchedDevice.model || matchedDevice.name || '',
            status: matchedDevice.status || '',
            androidVersion: matchedDevice.androidVersion || ''
          };
          setSelectedDevice(normalized);
          localStorage.setItem(SUPPORT_DEVICE_KEY, JSON.stringify(normalized));
        }
      } catch (err) {
        console.error('Error fetching selected device:', err);
      }
    };

    fetchSelectedDevice();
  }, [selectedDeviceId]);

  useEffect(() => {
    let mounted = true;

    const fetchConnectionStatus = async () => {
      try {
        const response = await axios.get(`${JAVA_API}/api/adb/connection-status`);
        if (!mounted) return;
        setConnectionStatus({
          usbConnected: !!response.data.usbConnected,
          usbDebuggingEnabled: !!response.data.usbDebuggingEnabled,
          authorizationPending: !!response.data.authorizationPending,
          connectedDevice: response.data.connectedDevice || null,
          properties: response.data.properties || null,
          message: response.data.message || 'Connection status updated'
        });
      } catch (err) {
        if (!mounted) return;
        setConnectionStatus({
          usbConnected: false,
          usbDebuggingEnabled: false,
          authorizationPending: false,
          connectedDevice: null,
          properties: null,
          message: 'Unable to reach the device bridge service.'
        });
      }
    };

    fetchConnectionStatus();
    const intervalId = setInterval(fetchConnectionStatus, 3000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const deviceSummary = useMemo(() => {
    if (selectedDevice) {
      return {
        label: `${selectedDevice.brand || ''} ${selectedDevice.model || selectedDevice.name || ''}`.trim(),
        issue: ticketData?.issue_category || '',
        androidVersion: selectedDevice.androidVersion || '',
        status: selectedDevice.status || ''
      };
    }

    if (ticketData) {
      return {
        label: `${ticketData.device_brand || ''} ${ticketData.device_model || ''}`.trim(),
        issue: ticketData.issue_category || '',
        androidVersion: '',
        status: ''
      };
    }

    return {
      label: 'No device selected',
      issue: '',
      androidVersion: '',
      status: ''
    };
  }, [selectedDevice, ticketData]);

  const actualDeviceLabel = useMemo(() => {
    if (connectionStatus.properties?.Manufacturer || connectionStatus.properties?.Model) {
      return `${connectionStatus.properties?.Manufacturer || ''} ${connectionStatus.properties?.Model || ''}`.trim();
    }
    return connectionStatus.connectedDevice?.id || 'No USB device detected';
  }, [connectionStatus]);

  const steps = [
    { num: 1, title: 'Connect Device' },
    { num: 2, title: 'Enable USB Debugging' },
    { num: 3, title: 'Authorize Connection' },
    { num: 4, title: 'Ready for Repair' }
  ];

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText('adb connect 192.168.1.100:5555');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const nextStep = () => setStep((current) => Math.min(current + 1, 4));
  const prevStep = () => setStep((current) => Math.max(current - 1, 1));

  const nextDisabled =
    (step === 1 && !connectionStatus.usbConnected) ||
    (step === 3 && !connectionStatus.usbDebuggingEnabled);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Connection Wizard</h1>
        <p className="text-slate-400">Follow these steps to connect your device for remote repair</p>
      </div>

      <div className="form-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr] gap-4 items-start">
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((s, index) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step > s.num ? 'bg-green-500 border-green-500' : step === s.num ? 'bg-blue-600 border-blue-600' : 'bg-slate-800 border-slate-600'
                }`}>
                  {step > s.num ? <CheckCircle size={20} className="text-white" /> : <span className="text-white">{s.num}</span>}
                </div>
                <span className={`ml-2 text-sm hidden md:inline ${step >= s.num ? 'text-white' : 'text-slate-500'}`}>{s.title}</span>
                {index < steps.length - 1 && <div className={`w-12 md:w-24 h-0.5 mx-2 ${step > s.num ? 'bg-green-500' : 'bg-slate-700'}`} />}
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-4 space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Selected Device</p>
            <p className="text-white font-medium">{deviceSummary.label}</p>
            {deviceSummary.issue && <p className="text-sm text-yellow-400">Issue: {deviceSummary.issue}</p>}
            {ticketId && <p className="text-sm text-blue-400">Ticket: {ticketId}</p>}
            <hr className="border-slate-700" />
            <p className="text-xs uppercase tracking-wide text-slate-400">Actual USB Device</p>
            <p className="text-slate-200 text-sm">{actualDeviceLabel}</p>
            <p className={`text-sm ${connectionStatus.usbConnected ? 'text-green-400' : 'text-yellow-400'}`}>{connectionStatus.message}</p>
          </div>
        </div>
      </div>

      <div className="form-card">
        {loading && !ticketData && ticketId ? (
          <div className="flex items-center justify-center h-48 gap-3 text-slate-300">
            <Loader2 className="animate-spin" size={22} />
            Loading ticket details...
          </div>
        ) : null}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Step 1: Connect Your Device</h2>
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                  <Usb size={20} className="text-blue-400" />
                  USB Connection
                </h3>
                <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                  <li>Connect your selected phone to your computer using a USB cable.</li>
                  <li>Use the original or a data-capable USB cable for best results.</li>
                  <li>This wizard will only continue after a real USB-connected device is detected.</li>
                </ol>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 opacity-70">
                <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                  <WifiOff size={20} className="text-slate-400" />
                  WiFi Connection (Temporarily Disabled)
                </h3>
                <ol className="list-decimal list-inside text-slate-400 space-y-2 text-sm">
                  <li>WiFi connection is disabled for now.</li>
                  <li>The instructions are preserved here for future use.</li>
                </ol>
                <div className="mt-4 flex gap-2">
                  <input type="text" value="192.168.1.100:5555" readOnly className="form-input flex-1" />
                  <button type="button" onClick={copyCommand} className="px-4 bg-slate-600 hover:bg-slate-500 rounded-lg text-white inline-flex items-center gap-2">
                    <Copy size={18} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button type="button" disabled className="px-4 bg-slate-700 rounded-lg text-slate-400 cursor-not-allowed">
                    Disabled
                  </button>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg border ${connectionStatus.usbConnected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-slate-800/70 border-slate-700 text-slate-300'}`}>
                <CheckCircle size={20} />
                <span className="text-sm">
                  {connectionStatus.usbConnected ? 'USB device detected. You can continue.' : 'Waiting for a real USB-connected device.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Step 2: Enable USB Debugging</h2>
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Enable Developer Options</h3>
                <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                  <li>Go to <strong className="text-white">Settings</strong> on your phone.</li>
                  <li>Open <strong className="text-white">About Phone</strong>.</li>
                  <li>Tap <strong className="text-white">Build Number</strong> 7 times.</li>
                  <li>Return to Settings and open <strong className="text-white">Developer Options</strong>.</li>
                </ol>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Current USB Debugging State</h3>
                <div className={`rounded-lg p-4 border ${connectionStatus.usbDebuggingEnabled ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                  <p className={connectionStatus.usbDebuggingEnabled ? 'text-green-400' : 'text-yellow-400'}>
                    {connectionStatus.usbDebuggingEnabled ? 'USB debugging is enabled on the connected device.' : 'USB debugging is not authorized yet. Enable it on the connected phone, then approve the prompt.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Step 3: Authorize Connection</h2>
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Allow USB Debugging</h3>
                <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                  <li>A popup should appear on your phone asking whether to allow USB debugging.</li>
                  <li>Check <strong className="text-white">Always allow from this computer</strong>.</li>
                  <li>Tap <strong className="text-white">Allow</strong>.</li>
                  <li>The Next button will unlock only after the connected device reports USB debugging as authorized.</li>
                </ol>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-400 flex-shrink-0" size={20} />
                  <div className="text-yellow-300 text-sm">
                    <p className="font-medium text-yellow-400">If you don't see the popup</p>
                    <p>Disconnect and reconnect the cable, keep Developer Options open, and wait for the wizard to detect authorization.</p>
                  </div>
                </div>
              </div>

              {connectionStatus.usbDebuggingEnabled ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-green-400">
                    <CheckCircle size={20} />
                    <span>Authorization successful. USB debugging is active on the connected device.</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-4 text-slate-300 text-sm">
                  Waiting for the connected device to authorize USB debugging...
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-400" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready for Repair!</h2>
            <p className="text-slate-400 mb-6">Your device is now connected. A technician will start the repair process shortly.</p>

            <div className="bg-slate-700/50 rounded-lg p-4 text-left mb-6">
              <h3 className="text-white font-medium mb-2">Connection Status:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Support Request Device:</span>
                  <span className="text-green-400 text-right">{deviceSummary.label}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Connected USB Device:</span>
                  <span className="text-green-400 text-right">{actualDeviceLabel}</span>
                </div>
                {deviceSummary.issue && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Issue:</span>
                    <span className="text-yellow-400 text-right">{deviceSummary.issue}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Connection:</span>
                  <span className="text-green-400">USB</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">USB Debugging:</span>
                  <span className="text-green-400">Authorized</span>
                </div>
                {ticketId && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Ticket:</span>
                    <span className="text-blue-400">{ticketId}</span>
                  </div>
                )}
              </div>
            </div>

            <Link to={ticketId ? `/customer/status/${encodeURIComponent(ticketId)}` : '/customer/status'} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
              <Terminal size={20} />
              View Live Status
            </Link>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-6 border-t border-slate-700">
          <button type="button" onClick={prevStep} disabled={step === 1} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white">
            <ChevronLeft size={20} />
            Previous
          </button>

          {step < 4 ? (
            <button type="button" onClick={nextStep} disabled={nextDisabled} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white">
              Next
              <ChevronRight size={20} />
            </button>
          ) : (
            <Link to={ticketId ? `/customer/status/${encodeURIComponent(ticketId)}` : '/customer/status'} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white">
              Go to Live Status
              <ChevronRight size={20} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
