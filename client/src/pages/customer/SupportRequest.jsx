import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Send,
  Smartphone
} from 'lucide-react';

const API_URL = 'http://localhost:5000';
const SUPPORT_DEVICE_KEY = 'radsSelectedSupportDevice';

export default function SupportRequest() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    deviceId: '',
    deviceBrand: '',
    deviceModel: '',
    issueType: '',
    issueDescription: '',
    urgency: 'normal'
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/customer/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const savedDevice = JSON.parse(localStorage.getItem(SUPPORT_DEVICE_KEY) || 'null');
    if (savedDevice) {
      setFormData((current) => ({
        ...current,
        deviceId: savedDevice.id || '',
        deviceBrand: savedDevice.brand || '',
        deviceModel: savedDevice.model || savedDevice.name || ''
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const customerId = user.id;
      const customerName = user.name;
      const customerEmail = user.email;

      const deviceResponse = await axios.post(`${API_URL}/api/devices`, {
        name: formData.deviceModel,
        brand: formData.deviceBrand,
        model: formData.deviceModel,
        status: 'disconnected'
      });

      const createdDevice = deviceResponse.data;

      const response = await axios.post(`${API_URL}/api/tickets`, {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: '',
        device_id: createdDevice?._id || '',
        device_name: createdDevice?.name || formData.deviceModel,
        device_brand: formData.deviceBrand,
        device_model: formData.deviceModel,
        issue_category: formData.issueType,
        issue_description: formData.issueDescription,
        urgency_level: formData.urgency
      });

      if (response.data.ticket_id) {
        localStorage.setItem(SUPPORT_DEVICE_KEY, JSON.stringify({
          id: createdDevice?._id || '',
          brand: formData.deviceBrand,
          model: formData.deviceModel,
          name: createdDevice?.name || formData.deviceModel,
          status: createdDevice?.status || 'disconnected',
          androidVersion: createdDevice?.androidVersion || ''
        }));
        setFormData((current) => ({ ...current, deviceId: createdDevice?._id || '' }));
        setTicketId(response.data.ticket_id);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Ticket creation error:', err);
      setError(err.response?.data?.error || 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const issueTypes = [
    'Device not turning on',
    'Bootloop',
    'Hardbrick',
    'Device running slow',
    'App crashing frequently',
    'Stuck on logo',
    'Software update failed',
    'FRP/Google lock',
    'Forgot password or pattern lock',
    'ADB not detecting device',
    'Fastboot mode issue',
    'Network or signal software issue',
    'WiFi or Bluetooth not working',
    'Battery draining after update',
    'Camera app not opening',
    'Audio not working after flash',
    'Touch not responding after update',
    'System UI crashing',
    'Storage or partition issue',
    'Other software issue'
  ];

  const wizardUrl = ticketId
    ? `/customer/wizard?ticket=${encodeURIComponent(ticketId)}${formData.deviceId ? `&device=${encodeURIComponent(formData.deviceId)}` : ''}`
    : '/customer/wizard';

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
          <div className="bg-slate-700/50 rounded-lg p-4 mb-6 text-left space-y-2">
            <div>
              <p className="text-sm text-slate-400">Ticket ID:</p>
              <p className="text-xl font-mono text-blue-400">{ticketId}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Selected Device:</p>
              <p className="text-white">{formData.deviceBrand} {formData.deviceModel}</p>
            </div>
            <p className="text-sm text-slate-400">Estimated response time: 15-30 minutes</p>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/customer/tickets" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
              <Smartphone size={20} />
              View My Tickets
            </Link>
            <Link to={wizardUrl} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
              Start Connection Wizard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Support Request</h1>
        <p className="text-slate-400">Describe your device issue and we'll help you fix it</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="form-card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Your Issue</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {issueTypes.slice(0, 6).map((issue) => (
              <button
                key={issue}
                type="button"
                onClick={() => setFormData((current) => ({ ...current, issueType: issue }))}
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
          <select name="issueType" value={formData.issueType} onChange={handleChange} className="form-input mt-4">
            <option value="">Select other issue...</option>
            {issueTypes.slice(6).map((issue) => (
              <option key={issue} value={issue}>{issue}</option>
            ))}
          </select>
        </div>

        <div className="form-card">
          <h3 className="text-lg font-semibold text-white mb-4">Device Information</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Device Brand *</label>
                <input
                  type="text"
                  name="deviceBrand"
                  value={formData.deviceBrand}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Samsung"
                  required
                />
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
                  <input type="radio" name="urgency" value="low" checked={formData.urgency === 'low'} onChange={handleChange} className="w-4 h-4" />
                  <span className="text-slate-300">Low</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="urgency" value="normal" checked={formData.urgency === 'normal'} onChange={handleChange} className="w-4 h-4" />
                  <span className="text-slate-300">Normal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="urgency" value="high" checked={formData.urgency === 'high'} onChange={handleChange} className="w-4 h-4" />
                  <span className="text-red-400">High</span>
                </label>
              </div>
            </div>

            <hr className="border-slate-700 my-4" />

            <h3 className="text-lg font-semibold text-white">Your Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Name</label>
                <input type="text" value={user?.name || ''} className="form-input bg-slate-600" disabled />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" value={user?.email || ''} className="form-input bg-slate-600" disabled />
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-slate-300">
                  <p className="font-medium text-white mb-1">Important</p>
                  <p>After submitting, the Connection Wizard will open with the same device already selected.</p>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || !formData.deviceBrand || !formData.deviceModel} className="form-button flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
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
