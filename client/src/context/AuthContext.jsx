import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api/auth';

const TOKEN_KEY = 'rads_token';
const USER_KEY = 'rads_user';
const LAST_ACTIVITY_KEY = 'rads_last_activity';
const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

function readStoredUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Block protected routes while we verify the session on refresh. */
function computeInitialLoading() {
  return !!sessionStorage.getItem(TOKEN_KEY);
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(() => computeInitialLoading());

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  const clearSession = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      const storedToken = sessionStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      axios.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      try {
        const response = await axios.get(`${API_URL}/me`, { timeout: 8000 });
        const userData = response.data.user;
        sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
        if (isMounted) setUser(userData);
      } catch (error) {
        // Retry once for transient failures (like dev hot reload moments).
        try {
          const response = await axios.get(`${API_URL}/me`, { timeout: 8000 });
          const userData = response.data.user;
          sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
          if (isMounted) setUser(userData);
        } catch {
          // If the server is down (or token is invalid), force sign-in.
          if (isMounted) clearSession();
        } finally {
          if (isMounted) setLoading(false);
        }
      }
      if (isMounted) setLoading(false);
    };

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  // Inactivity timeout: sign out after 10 minutes without any user interaction.
  useEffect(() => {
    if (!token) return;

    const markActivity = () => {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    };

    markActivity();

    const onActivity = () => markActivity();
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));

    const interval = window.setInterval(() => {
      const last = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY) || '0');
      if (!Number.isFinite(last) || last <= 0) return;
      if (Date.now() - last > INACTIVITY_MS) {
        clearSession();
      }
    }, 30 * 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onActivity));
      window.clearInterval(interval);
    };
  }, [token]);

  const persistSession = (sessionToken, userData) => {
    sessionStorage.setItem(TOKEN_KEY, sessionToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    setToken(sessionToken);
    setUser(userData);
  };

  const login = async (email, password, options = {}) => {
    const { allowedRoles } = options;

    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });

      if (response.data.token) {
        const { token: sessionToken, user: userData } = response.data;

        const normalizedRole = String(userData?.role ?? '').toUpperCase().trim();
        const normalizedAllowedRoles = (allowedRoles || []).map((r) =>
          String(r ?? '').toUpperCase().trim()
        );

        if (normalizedAllowedRoles.length && !normalizedAllowedRoles.includes(normalizedRole)) {
          clearSession();
          throw new Error(options.invalidRoleMessage || 'You do not have access to this portal.');
        }

        persistSession(sessionToken, { ...userData, role: normalizedRole });
        setLoading(false);
        return userData;
      }

      throw new Error('Login failed. Please try again.');
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Login failed. Please try again.';
      throw new Error(message);
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/register`, { name, email, password });

      if (response.data.message) {
        return await login(email, password, { allowedRoles: ['CUSTOMER'] });
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
      throw new Error(message);
    }
  };

  const logout = () => {
    clearSession();
    setLoading(false);
  };

  const fetchCurrentUser = async () => {
    if (!token) return null;

    try {
      const response = await axios.get(`${API_URL}/me`, { timeout: 8000 });
      const userData = response.data.user;

      sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
      }
      return null;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    fetchCurrentUser,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'ADMIN',
    isTechnician: user?.role === 'TECHNICIAN',
    isCustomer: user?.role === 'CUSTOMER'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
