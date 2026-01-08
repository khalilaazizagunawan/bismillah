import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminInfo = localStorage.getItem('adminData');

    if (token && adminInfo) {
      setIsAdmin(true);
      setAdminData(JSON.parse(adminInfo));
    }
  }, []);

  const login = async (email, password) => {
    // Local mock login to bypass backend dependency
    if (email.trim() === 'admin@toko-kue.com' && password.trim() === 'admin123') {
      const admin = { id: '1', email: 'admin@toko-kue.com' };
      const token = 'mock-token-' + Date.now();

      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminData', JSON.stringify(admin));
      setIsAdmin(true);
      setAdminData(admin);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    setAdminData(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
  };

  return (
    <AuthContext.Provider value={{ isAdmin, adminData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}