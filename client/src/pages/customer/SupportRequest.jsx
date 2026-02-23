import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  Send, 
  Smartphone,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function SupportRequest() {
  const [formData, setFormData] = useState({
    deviceBrand: '',
    deviceModel: '',
    issueType: '',
    issueDescription: '',
    urgency: 'normal',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  const issueTypes = [
    'Bootloop/Not turning on',
    'Screen issues',
    'Battery problems',
    'Charging issues',
    'Software problems',
    'Network/WiFi issues',
    'Audio problems',
    'Camera issues',
    'Touchscreen not working',
    'Forgot password/FRP',
    'Water damage',
    'Other'
  ];

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="form-card text-center py-12">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
          <p className="text-slate-400 mb-6">
            Your support request has been submitted successfully. Our technicians will review it shortly.
          </p>
          <div className="bg-slate-700/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-slate-400 mb-2">Request ID: #RADS-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            <p className="text-sm text-slate-400">Estimated response time: 15-30 minutes</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link
              to="/customer/wizard"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              <Smartphone size={20} />
              Start Connection Wizard
            </Link>
            <Link
              to="/customer/status"
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
            >
              Check Status
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Support Request</h1>
        <p className="text-slate-400">Describe your device issue and we'll help you fix it</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Quick Issue Selection */}
        <div className="form-card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Your Issue</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {issueTypes.slice(0, 6).map((issue, index) => (
              <button
                key={index}
                onClick={() => setFormData({ ...formData, issueType: issue })}
                className={`p-3 rounded-lg text-sm text-left transition-colors ${
                  formData.issueType === issue 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {issue}
              </button>
            ))}
          </div>
          <select
            name="issueType"
            value={formData.issueType}
            onChange={handleChange}
            className="form-input mt-4"
          >
            <option value="">Select other issue...</option>
            {issueTypes.slice(6).map((issue, index) => (
              <option key={index} value={issue}>{issue}</option>
            ))}
          </select>
        </div>

        {/* Support Form */}
        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4">Device Information</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Device Brand *</label>
                <select
                  name="deviceBrand"
                  value={formData.deviceBrand}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Select brand...</option>
                  <option value="Samsung">Samsung</option>
                  <option value="OnePlus">OnePlus</option>
                  <option value="Xiaomi">Xiaomi</option>
                  <option value="Realme">Realme</option>
                  <option value="Oppo">Oppo</option>
                  <option value="Vivo">Vivo</option>
                  <option value="Motorola">Motorola</option>
                  <option value="Google">Google</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Device Model *</label>
                <input
                  type="text"
                  name="deviceModel"
                  value={formData.deviceModel}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., SM-G991B"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Describe Your Issue *</label>
              <textarea
                name="issueDescription"
                value={formData.issueDescription}
                onChange={handleChange}
                className="form-input min-h-[120px]"
                placeholder="Please describe what happened and when the issue started..."
                required
              />
            </div>

            <div>
              <label className="form-label">Urgency</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value="low"
                    checked={formData.urgency === 'low'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-300">Low</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value="normal"
                    checked={formData.urgency === 'normal'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-300">Normal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="urgency"
                    value="high"
                    checked={formData.urgency === 'high'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-red-400">High</span>
                </label>
              </div>
            </div>

            <hr className="border-slate-700 my-4" />

            <h3 className="text-lg font-semibold text-white">Your Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Phone *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-slate-300">
                  <p className="font-medium text-white mb-1">Important</p>
                  <p>After submitting, you'll need to run our Connection Wizard to allow our technicians remote access to your device.</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="form-button flex items-center justify-center gap-2"
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <Send size={20} />
                  Submit Request
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
