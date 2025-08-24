// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../api'
// DEBUG — remove after fixing
console.log("REACT_APP_API_URL =", process.env.REACT_APP_API_URL);


const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [unreads, setUnreads] = useState({ chats: 0, notifications: 0 });

  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL;

  // 🔹 Check if user already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setReady(true); return; }

    axios.get(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        setUser(res.data);

        try {
          const { data } = await axios.get(`${API}/unreads`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUnreads({
            chats: Number.isFinite(data?.chats) ? data.chats : 0,
            notifications: Number.isFinite(data?.notifications) ? data.notifications : 0,
          });
        } catch {
          // fallback: leave counters at 0
        }
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setReady(true));
  }, [API]);

  // 🔹 LOGIN - Updated to handle both email and username
  const login = async (loginData) => {
    try {
      const requestData =
        typeof loginData === 'string'
          ? { email: loginData, password: arguments[1] }
          : loginData;

      // NOTE: backend mounts auth at /api/auth
      const res = await api.post(`/api/auth/login`, requestData);

      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setUnreads({ chats: 0, notifications: 0 });
      navigate('/home', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      const error = new Error(msg);
      error.response = err.response;
      throw error;
    }
  };

  // 🔹 REGISTER
  const register = async (username, email, password) => {
    try {
      await axios.post(`${API}/users/register`,
        { username, email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      // After registration, login with email
      const loginRes = await axios.post(`${API}/users/login`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      localStorage.setItem('token', loginRes.data.token);
      setUser(loginRes.data.user);
      setUnreads({ chats: 0, notifications: 0 });

      localStorage.setItem('justSignedUp', '1');
      navigate('/home?new=1', { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      const error = new Error(errorMessage);
      error.response = err.response;
      throw error;
    }
  };

  // 🔹 LOGOUT
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUnreads({ chats: 0, notifications: 0 });
    navigate('/login');
  };

  // 🔹 FORGOT PASSWORD
  const forgotPassword = async (email) => {
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email });
      return res.data; // message
    } catch (err) {
      throw err.response?.data || { message: 'Error sending reset email' };
    }
  };

  // 🔹 RESET PASSWORD
  const resetPassword = async (token, password) => {
    try {
      const res = await axios.post(`${API}/auth/reset-password/${token}`, { password });
      return res.data; // message
    } catch (err) {
      throw err.response?.data || { message: 'Error resetting password' };
    }
  };

  // 🔹 REFRESH USER DATA (useful for profile updates)
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      // If token is invalid, logout user
      if (err.response?.status === 401) {
        logout();
      }
      throw err;
    }
  };

  // 🔹 UPDATE USER PROFILE (helper method)
  const updateProfile = async (profileData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    try {
      const res = await axios.put(`${API}/users/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setUser(res.data.user || res.data);
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Profile update failed';
      const error = new Error(errorMessage);
      error.response = err.response;
      throw error;
    }
  };

  // ===== Unread helpers =====
  const bumpChats = (n = 1) => setUnreads(u => ({ ...u, chats: Math.max(0, u.chats + n) }));
  const bumpNotifs = (n = 1) => setUnreads(u => ({ ...u, notifications: Math.max(0, u.notifications + n) }));
  const resetChatsUnread = () => setUnreads(u => ({ ...u, chats: 0 }));
  const resetNotifsUnread = () => setUnreads(u => ({ ...u, notifications: 0 }));
  const setChatsCount = (count) => setUnreads(u => ({ ...u, chats: Math.max(0, count) }));
  const setNotifsCount = (count) => setUnreads(u => ({ ...u, notifications: Math.max(0, count) }));

  // 🔹 GET AUTH HEADER (utility function)
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 🔹 CHECK IF AUTHENTICATED
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,              // ✅ Updated to handle email/username
        register,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,        // ✅ New utility function
        updateProfile,      // ✅ New utility function  
        getAuthHeader,      // ✅ New utility function
        isAuthenticated,    // ✅ New utility function
        unreads,
        bumpChats,
        bumpNotifs,
        resetChatsUnread,
        resetNotifsUnread,
        setChatsCount,
        setNotifsCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
