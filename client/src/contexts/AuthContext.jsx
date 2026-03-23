import { createContext, useContext, useState, useEffect } from 'react';
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
} from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, verify cookie session
  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const userData = await apiLogin(email, password);
    setUser(userData);
    return userData;
  }

  async function register(email, displayName, password) {
    const userData = await apiRegister(email, displayName, password);
    setUser(userData);
    return userData;
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  async function forgotPassword(email) {
    return apiForgotPassword(email);
  }

  async function resetPassword(token, password) {
    return apiResetPassword(token, password);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
