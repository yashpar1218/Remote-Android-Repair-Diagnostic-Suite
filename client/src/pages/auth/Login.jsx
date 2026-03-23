import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Smartphone, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const { login, user, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // If someone lands on staff login while already authenticated as a CUSTOMER,
  // clear the old customer session so the "Customer Portal" link doesn't auto-log in.
  useEffect(() => {
    if (!user) return;
    if (String(user.role ?? '').toUpperCase().trim() === 'CUSTOMER') {
      logout();
    }
  }, [user, logout]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password, {
        allowedRoles: ['ADMIN', 'TECHNICIAN'],
        invalidRoleMessage: 'Customer accounts must sign in through the customer portal.'
      });

      if (user.role === 'ADMIN') {
        navigate('/admin/users');
      } else {
        navigate('/dashboard/devices');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Smartphone className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">RADS</h1>
          <p className="text-slate-400 mt-2">Remote Android Device Support</p>
        </div>

        <div className="form-card">
          <h2 className="text-2xl font-bold text-white mb-6">Staff Login</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="staff@rads.com"
                required
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pr-10"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="form-button flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Need support?{' '}
              <Link to="/customer/support" className="text-blue-400 hover:underline">
                Customer Portal
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-2">Demo Credentials:</p>
            <p className="text-xs text-slate-300">Admin: admin@rads.com</p>
            <p className="text-xs text-slate-300">Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
