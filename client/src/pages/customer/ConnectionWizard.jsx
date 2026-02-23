import { useState } from 'react';
import { 
  Cable, 
  Smartphone, 
  Usb, 
  CheckCircle, 
  AlertCircle,
  Copy,
  RefreshCw,
  Terminal,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export default function ConnectionWizard() {
  const [step, setStep] = useState(1);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [usbDebugging, setUsbDebugging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const steps = [
    { num: 1, title: 'Connect Device' },
    { num: 2, title: 'Enable USB Debugging' },
    { num: 3, title: 'Authorize Connection' },
    { num: 4, title: 'Ready for Repair' }
  ];

  const copyCommand = () => {
    navigator.clipboard.writeText('adb connect 192.168.1.100:5555');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateConnection = () => {
    setLoading(true);
    setTimeout(() => {
      setDeviceConnected(true);
      setLoading(false);
    }, 2000);
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Connection Wizard</h1>
        <p className="text-slate-400">Follow these steps to connect your device for remote repair</p>
      </div>

      {/* Progress Steps */}
      <div className="form-card mb-6">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step > s.num 
                  ? 'bg-green-500 border-green-500' 
                  : step === s.num 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-slate-800 border-slate-600'
              }`}>
                {step > s.num ? <CheckCircle size={20} className="text-white" /> : <span className="text-white">{s.num}</span>}
              </div>
              <span className={`ml-2 text-sm hidden md:inline ${step >= s.num ? 'text-white' : 'text-slate-500'}`}>
                {s.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 md:w-24 h-0.5 mx-2 ${step > s.num ? 'bg-green-500' : 'bg-slate-700'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="form-card">
        {/* Step 1: Connect Device */}
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
                  <li>Connect your Android device to your computer using a USB cable</li>
                  <li>Use the original USB cable for best results</li>
                  <li>Select "File Transfer" or "MTP" mode when prompted</li>
                </ol>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                  <Cable size={20} className="text-green-400" />
                  WiFi Connection (Alternative)
                </h3>
                <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                  <li>Ensure your device and computer are on the same WiFi network</li>
                  <li>Enter the IP address shown by the technician</li>
                  <li>Click connect below</li>
                </ol>
                <div className="mt-4 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="192.168.1.100:5555"
                    className="form-input flex-1"
                  />
                  <button 
                    onClick={simulateConnection}
                    disabled={loading}
                    className="px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Connect'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="text-green-400" size={20} />
                <span className="text-green-400 text-sm">Device connected successfully!</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Enable USB Debugging */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Step 2: Enable USB Debugging</h2>
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Enable Developer Options</h3>
                <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                  <li>Go to <strong className="text-white">Settings</strong> on your phone</li>
                  <li>Scroll down and tap <strong className="text-white">About Phone</strong></li>
                  <li>Find <strong className="text-white">Build Number</strong></li>
                  <li>Tap <strong className="text-white">Build Number</strong> 7 times</li>
                  <li>Enter your PIN/pattern if prompted</li>
                </ol>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Enable USB Debugging</h3>
                <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                  <li>Go to <strong className="text-white">Settings → Developer Options</strong></li>
                  <li>Toggle <strong className="text-white">Developer Options</strong> ON</li>
                  <li>Toggle <strong className="text-white">USB Debugging</strong> ON</li>
                  <li>Confirm the security prompt</li>
                </ol>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  💡 Tip: On some devices, Developer Options is in Settings → System → Developer Options
                </p>
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={usbDebugging}
                  onChange={(e) => setUsbDebugging(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-white">I have enabled USB Debugging</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Authorize Connection */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Step 3: Authorize Connection</h2>
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Allow USB Debugging</h3>
                <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                  <li>A popup should appear on your phone saying "Allow USB debugging?"</li>
                  <li>Check the box <strong className="text-white">"Always allow from this computer"</strong></li>
                  <li>Tap <strong className="text-white">Allow</strong></li>
                </ol>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-400 flex-shrink-0" size={20} />
                  <div className="text-yellow-400 text-sm">
                    <p className="font-medium">If you don't see the popup</p>
                    <p className="text-yellow-400/70">Try disconnecting and reconnecting the USB cable, or check if USB debugging is actually enabled.</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-400" size={20} />
                  <span className="text-green-400">Authorization successful!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Ready */}
        {step === 4 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-400" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready for Repair!</h2>
            <p className="text-slate-400 mb-6">
              Your device is now connected. A technician will start the repair process shortly.
            </p>
            
            <div className="bg-slate-700/50 rounded-lg p-4 text-left mb-6">
              <h3 className="text-white font-medium mb-2">Connection Status:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Device:</span>
                  <span className="text-green-400">Samsung Galaxy S21</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Connection:</span>
                  <span className="text-green-400">USB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-green-400">Ready</span>
                </div>
              </div>
            </div>

            <a 
              href="/customer/status" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              <Terminal size={20} />
              View Live Status
            </a>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-6 border-t border-slate-700">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
          >
            <ChevronLeft size={20} />
            Previous
          </button>
          
          {step < 4 ? (
            <button
              onClick={nextStep}
              disabled={step === 2 && !usbDebugging}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
            >
              Next
              <ChevronRight size={20} />
            </button>
          ) : (
            <a 
              href="/customer/status" 
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
            >
              Go to Live Status
              <ChevronRight size={20} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
