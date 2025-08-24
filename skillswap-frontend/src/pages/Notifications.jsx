import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';

import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ---------------- Optimized Background Components ----------------
const GradientBlobs = () => {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
      <motion.div
        className="absolute w-64 h-64 rounded-full -top-24 -left-16 blur-3xl opacity-60"
        style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.15), transparent)' }}
        animate={{ 
          x: [-20, 12, -8], 
          y: [0, 18, -14], 
          rotate: [0, 18, -12] 
        }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: 'linear', 
          repeatType: 'reverse' 
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 rounded-full opacity-50 h-72 w-72 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.12), transparent)' }}
        animate={{ 
          x: [12, -10, 14], 
          y: [-10, 10, -8], 
          rotate: [0, -12, 10] 
        }}
        transition={{ 
          duration: 35, 
          repeat: Infinity, 
          ease: 'linear', 
          repeatType: 'reverse' 
        }}
      />
      <motion.div
        className="absolute w-56 h-56 rounded-full top-1/3 left-1/3 blur-3xl opacity-40"
        style={{ background: 'radial-gradient(closest-side, rgba(20,184,166,0.10), transparent)' }}
        animate={{ 
          x: [0, 10, -6], 
          y: [0, -8, 10] 
        }}
        transition={{ 
          duration: 40, 
          repeat: Infinity, 
          ease: 'linear', 
          repeatType: 'reverse' 
        }}
      />
    </div>
  );
};

const FloatingDots = ({ count = 8 }) => {
  const dots = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 8,
    })),
    [count]
  );
  
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-black/3"
          style={{ 
            left: d.left, 
            top: d.top, 
            width: d.size, 
            height: d.size 
          }}
          animate={{ 
            y: [-6, 6, -6], 
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ 
            duration: d.duration, 
            repeat: Infinity, 
            delay: d.delay, 
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

const GeometricShapes = () => {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <motion.div
        className="absolute w-12 h-12 border right-10 top-24 rounded-xl border-black/3 bg-white/5"
        animate={{ 
          rotate: [0, 5, -5, 0], 
          scale: [1, 1.01, 0.99, 1] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 25, 
          repeatType: 'reverse',
          ease: 'easeInOut'
        }}
      />
      <motion.div
        className="absolute w-10 h-10 border rounded-full left-10 bottom-24 border-black/3 bg-white/4"
        animate={{ 
          y: [0, -4, 4, 0], 
          scale: [1, 1.005, 0.995, 1] 
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 20, 
          repeatType: 'reverse',
          ease: 'easeInOut'
        }}
      />
    </div>
  );
};

// Optimized counter with less frequent updates
const Counter = ({ to = 0, className = '' }) => {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) => Math.round(latest));
  
  useEffect(() => {
    const controls = animate(mv, to, { 
      duration: 0.6,
      ease: 'easeOut'
    });
    return controls.stop;
  }, [mv, to]);
  
  return <motion.span className={className}>{rounded}</motion.span>;
};

// ---------------- Main Component ----------------
function Notifications({ socket = null }) {
  // Consolidated state to reduce re-renders
  const [state, setState] = useState({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: ''
  });

  const { user, setNotifsCount, bumpNotifs, resetNotifsUnread } = useAuth() || {};

  // Memoized handlers to prevent recreation on every render
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const markRead = useCallback(async (id) => {
    updateState({ error: '' });
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setState(prev => {
        const updatedNotifications = prev.notifications.map(n => 
          n._id === id ? { ...n, read: true } : n
        );
        const newUnreadCount = Math.max(0, prev.unreadCount - 1);
        
        // Update global badge
        setNotifsCount?.(newUnreadCount);
        
        return {
          ...prev,
          notifications: updatedNotifications,
          unreadCount: newUnreadCount
        };
      });
    } catch (err) {
      updateState({ error: err.response?.data?.message || 'Failed to mark as read' });
      console.error('Mark read error:', err);
    }
  }, [setNotifsCount, updateState]);

  const markAllRead = useCallback(async () => {
    updateState({ error: '' });
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
      
      resetNotifsUnread?.();
    } catch (err) {
      updateState({ error: err.response?.data?.message || 'Failed to mark all as read' });
      console.error('Mark all read error:', err);
    }
  }, [resetNotifsUnread, updateState]);

  const deleteNotification = useCallback(async (id) => {
    updateState({ error: '' });
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      setState(prev => {
        const deletedNotif = prev.notifications.find(n => n._id === id);
        const filteredNotifications = prev.notifications.filter(n => n._id !== id);
        const newUnreadCount = deletedNotif && !deletedNotif.read 
          ? Math.max(0, prev.unreadCount - 1) 
          : prev.unreadCount;
        
        // Update global badge if needed
        if (deletedNotif && !deletedNotif.read) {
          setNotifsCount?.(newUnreadCount);
        }
        
        return {
          ...prev,
          notifications: filteredNotifications,
          unreadCount: newUnreadCount
        };
      });
    } catch (err) {
      updateState({ error: err.response?.data?.message || 'Failed to delete notification' });
      console.error('Delete notification error:', err);
    }
  }, [setNotifsCount, updateState]);

  // Load initial data
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        const [notificationsRes, unreadCountRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/notifications`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          })
        ]);
        
        if (mounted) {
          const apiCount = Number(unreadCountRes.data.count || 0);
          setState({
            notifications: notificationsRes.data,
            unreadCount: apiCount,
            loading: false,
            error: ''
          });
          setNotifsCount?.(apiCount);
        }
      } catch (err) {
        if (mounted) {
          updateState({
            error: err.response?.data?.message || 'Failed to load notifications',
            loading: false
          });
        }
        console.error('Load notifications error:', err);
      }
    };

    loadData();

    // Socket listener with cleanup
    if (socket) {
      const onNew = (notif) => {
        if (mounted) {
          setState(prev => ({
            ...prev,
            notifications: [notif, ...prev.notifications],
            unreadCount: prev.unreadCount + 1
          }));
          bumpNotifs?.(1);
        }
      };
      
      socket.on('notification:new', onNew);
      return () => {
        mounted = false;
        socket.off('notification:new', onNew);
      };
    }

    return () => { mounted = false; };
  }, [socket, setNotifsCount, bumpNotifs, updateState]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return date.toLocaleDateString();
  }, []);

  const { notifications, unreadCount, loading, error } = state;
  const totalCount = notifications.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen pt-20 text-gray-900 bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50"
    >
      {/* Background - rendered once */}
      <GradientBlobs />
      <FloatingDots />
      <GeometricShapes />

      <div className="container max-w-4xl p-4 mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 border rounded-full border-emerald-300/40 bg-emerald-50/80 backdrop-blur-sm">
              <span className="relative inline-flex">
                <span className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-emerald-500"></span>
                <motion.span 
                  className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </span>
              <span className="text-xs font-semibold text-emerald-700">Live</span>
              <span className="text-xs text-gray-700">Notifications</span>
            </div>

            {/* Notification Badge */}
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full shadow-sm bg-white/80 backdrop-blur-sm">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                
                <AnimatePresence mode="wait">
                  {unreadCount > 0 ? (
                    <motion.div
                      key="badge"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="relative min-w-[24px] h-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-2 shadow-lg"
                    >
                      <Counter to={unreadCount} className="font-bold text-white" />
                    </motion.div>
                  ) : (
                    <motion.span
                      key="all-read"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs font-medium text-gray-500"
                    >
                      All read
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h2 className="bg-[linear-gradient(92deg,#111827,#4f46e5,#06b6d4)] bg-clip-text text-3xl font-extrabold leading-tight text-transparent">
                Stay in the loop, {user?.name || user?.email?.split('@')[0] || 'friend'} 👋
              </h2>
              <p className="mt-1 text-sm text-gray-700/80">All your request updates and system alerts in one calm, glassy place.</p>
            </div>
            
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="text-right"
                >
                  <p className="text-sm font-semibold text-red-600">
                    {unreadCount} unread
                  </p>
                  <p className="text-xs text-gray-500">
                    {unreadCount === 1 ? 'notification' : 'notifications'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Quick Actions + Stats */}
        <motion.div 
          className="grid gap-4 mb-6 md:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="p-4 border border-gray-200 shadow-sm rounded-2xl bg-white/80 backdrop-blur-sm">
            <p className="text-sm text-gray-700">Unread</p>
            <Counter to={unreadCount} className="text-3xl font-bold text-gray-900" />
          </div>

          <div className="p-4 border border-gray-200 shadow-sm rounded-2xl bg-white/80 backdrop-blur-sm">
            <p className="text-sm text-gray-700">Total</p>
            <Counter to={totalCount} className="text-3xl font-bold text-gray-900" />
          </div>

          <div className="flex items-center justify-between gap-2 p-4 border border-gray-200 shadow-sm rounded-2xl bg-white/80 backdrop-blur-sm">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={markAllRead}
              disabled={loading || unreadCount === 0}
              className="px-4 py-2 text-sm font-semibold text-white transition-opacity shadow rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark All Read
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-4 py-2 text-sm transition-colors border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm hover:bg-white/80"
            >
              Scroll Top
            </motion.button>
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 mb-4 border rounded-xl border-rose-200 bg-rose-50/80 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-rose-700">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <motion.div 
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-200 rounded-full border-t-indigo-600 animate-spin"></div>
              <p className="font-medium text-indigo-600">Loading notifications...</p>
            </div>
          </motion.div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {!loading && notifications.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="p-10 text-center border border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm"
            >
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No notifications yet</h3>
              <p className="text-sm text-gray-600">You'll see updates about your skill exchange requests here.</p>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {notifications.map((notif, index) => (
              <motion.div
                key={notif._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  duration: 0.3,
                  delay: loading ? index * 0.05 : 0,
                  layout: { duration: 0.3, ease: 'easeOut' }
                }}
                className={`rounded-2xl border p-5 shadow-sm backdrop-blur-sm transition-all duration-300 ${
                  notif.read
                    ? 'border-gray-200 bg-white/80 hover:bg-white/90'
                    : 'border-indigo-200 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 hover:from-indigo-100/90 hover:to-purple-100/90'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!notif.read && (
                        <motion.span 
                          className="w-2 h-2 bg-indigo-500 rounded-full"
                          animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                      <h3 className="font-semibold text-gray-900 truncate">
                        {notif.title}
                      </h3>
                    </div>
                    <p className={`text-sm leading-relaxed ${notif.read ? 'text-gray-600' : 'text-gray-700'}`}>
                      {notif.body}
                    </p>
                    {notif.createdAt && (
                      <p className="flex items-center gap-1 mt-3 text-xs text-gray-500">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(notif.createdAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    {!notif.read && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => markRead(notif._id)}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-700 border border-indigo-200 rounded-lg bg-white/70 hover:bg-white/90 hover:border-indigo-300 transition-all duration-200"
                        disabled={loading}
                      >
                        Mark Read
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => deleteNotification(notif._id)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white/70 text-rose-600 hover:bg-white/90 hover:border-rose-200 hover:text-rose-700 transition-all duration-200"
                      disabled={loading}
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Scroll-to-top FAB */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed z-40 p-3 transition-all duration-200 border border-gray-200 shadow-lg bottom-6 right-6 rounded-2xl bg-white/90 backdrop-blur-sm hover:bg-white"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/>
        </svg>
      </motion.button>
    </motion.div>
  );
}

export default Notifications;