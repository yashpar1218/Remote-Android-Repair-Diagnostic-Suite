import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('rads_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simulated login - replace with actual API call
    const userData = {
      id: '1',
      email,
      name: 'Technician',
      role: email.includes('admin') ? 'admin' : 'technician',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=technician'
    };
    setUser(userData);
    localStorage.setItem('rads_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    // Simulated registration
    setUser(userData);
    localStorage.setItem('rads_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rads_user');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTechnician: user?.role === 'technician'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
