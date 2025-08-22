// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

  // 🔹 LOGIN
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API}/users/login`,
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setUnreads({ chats: 0, notifications: 0 });

      navigate('/home', { replace: true });
    } catch (err) {
      throw err;
    }
  };

  // 🔹 REGISTER
  const register = async (username, email, password) => {
    await axios.post(`${API}/users/register`,
      { username, email, password },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const loginRes = await axios.post(`${API}/users/login`,
      { email, password },
      { headers: { 'Content-Type': 'application/json' } }
    );

    localStorage.setItem('token', loginRes.data.token);
    setUser(loginRes.data.user);
    setUnreads({ chats: 0, notifications: 0 });

    localStorage.setItem('justSignedUp', '1');
    navigate('/home?new=1', { replace: true });
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

  // ===== Unread helpers =====
  const bumpChats = (n = 1) => setUnreads(u => ({ ...u, chats: Math.max(0, u.chats + n) }));
  const bumpNotifs = (n = 1) => setUnreads(u => ({ ...u, notifications: Math.max(0, u.notifications + n) }));
  const resetChatsUnread = () => setUnreads(u => ({ ...u, chats: 0 }));
  const resetNotifsUnread = () => setUnreads(u => ({ ...u, notifications: 0 }));
  const setChatsCount = (count) => setUnreads(u => ({ ...u, chats: Math.max(0, count) }));
  const setNotifsCount = (count) => setUnreads(u => ({ ...u, notifications: Math.max(0, count) }));

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        register,
        logout,
        forgotPassword,   // ✅ expose forgot password
        resetPassword,    // ✅ expose reset password
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
