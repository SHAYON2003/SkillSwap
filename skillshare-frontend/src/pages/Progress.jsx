// src/pages/Progress.jsx
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, emoji }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-5 border shadow-sm rounded-2xl border-white/30 bg-white/60 backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-xl">{emoji}</span>
      </div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
    </motion.div>
  );
}

function SkillProgress({ title, items = [] }) {
  // Safety check for items array
  const safeItems = Array.isArray(items) ? items : [];
  const max = useMemo(() => {
    if (safeItems.length === 0) return 1;
    return Math.max(1, ...safeItems.map(i => i?.count || 0));
  }, [safeItems]);
  
  return (
    <div className="p-5 border shadow-sm rounded-2xl border-white/30 bg-white/60 backdrop-blur">
      <div className="mb-4 text-sm font-semibold text-slate-800">{title}</div>
      {safeItems.length === 0 ? (
        <div className="text-sm text-slate-500">No data yet.</div>
      ) : (
        <div className="space-y-3">
          {safeItems.map((it, idx) => {
            const pct = Math.round(((it?.count || 0) / max) * 100);
            // Generate a more unique key
            const key = it?.name ? `${it.name}-${idx}` : `item-${idx}`;
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{it?.name || 'Unknown'}</span>
                  <span className="text-slate-500">{it?.count || 0}</span>
                </div>
                <div className="w-full h-2 mt-1 overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentList({ items = [] }) {
  const safeItems = Array.isArray(items) ? items : [];
  
  if (!safeItems.length) {
    return (
      <div className="p-5 text-sm border shadow-sm rounded-2xl border-white/30 bg-white/60 backdrop-blur text-slate-500">
        No completed swaps yet.
      </div>
    );
  }
  
  return (
    <div className="p-5 border shadow-sm rounded-2xl border-white/30 bg-white/60 backdrop-blur">
      <div className="mb-4 text-sm font-semibold text-slate-800">Recent Completed Swaps</div>
      <ul className="divide-y divide-slate-200/70">
        {safeItems.slice(0, 8).map((r, index) => {
          // Create a more reliable key
          const key = r?._id || r?.id || `swap-${index}`;
          return (
            <li key={key} className="py-3">
              <div className="flex items-center justify-between">
                <div className="text-slate-800">
                  <span className="font-medium">{r?.skillOffered?.name || '—'}</span>
                  <span className="mx-2 text-slate-400">⇄</span>
                  <span className="font-medium">{r?.skillRequested?.name || '—'}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {r?.completedAt ? new Date(r.completedAt).toLocaleDateString() : ''}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- normalize helpers for new schema or old API ---------- */
const mapToArray = (objOrMap) => {
  if (!objOrMap) return [];
  
  try {
    // Mongoose Map serializes to plain object in JSON
    if (objOrMap instanceof Map) {
      return Array.from(objOrMap.entries()).map(([name, count]) => ({ name, count }));
    }
    if (typeof objOrMap === 'object' && objOrMap !== null) {
      return Object.entries(objOrMap).map(([name, count]) => ({ name, count }));
    }
  } catch (error) {
    console.warn('Error converting object to array:', error);
  }
  
  return [];
};

// New helper to merge skills with progress
const mergeSkillsWithProgress = (skillsArray, progressData) => {
  if (!Array.isArray(skillsArray)) return [];
  
  const progressMap = {};
  if (progressData) {
    // Convert progress data to a map for easy lookup
    if (progressData instanceof Map) {
      progressData.forEach((count, name) => {
        progressMap[name] = count;
      });
    } else if (typeof progressData === 'object') {
      Object.entries(progressData).forEach(([name, count]) => {
        progressMap[name] = count;
      });
    }
  }
  
  return skillsArray.map(skill => ({
    name: skill.name,
    // Prioritize progress count over skill's own swapsCount
    count: progressMap[skill.name] || skill.count || skill.swapsCount || 0
  }));
};

// Safe localStorage access
const getAuthToken = () => {
  try {
    return typeof window !== 'undefined' && window.localStorage 
      ? localStorage.getItem('token') 
      : null;
  } catch (error) {
    console.warn('Cannot access localStorage:', error);
    return null;
  }
};

export default function Progress() {
  const { user } = useAuth();
  const API = process.env.REACT_APP_API_URL;
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [server, setServer] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    
    const fetchProgress = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr('');
      
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const res = await axios.get(`${API}/api/progress`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        
        if (!cancelled) {
          setServer(res.data);
        }
      } catch (e) {
        if (!cancelled && !controller.signal.aborted) {
          const errorMessage = e.response?.data?.message || 
                              e.message || 
                              'Could not load progress';
          setErr(errorMessage);
          setServer(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProgress();
    
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [API, user]);

  // ---- read swapsCount (prefer server, fallback to user.progress) ----
  const swapsCount = useMemo(() => {
    return server?.swapsCount ??
           server?.progress?.swapsCount ??
           user?.progress?.swapsCount ??
           0;
  }, [server, user]);

  // ---- read offered / learned arrays with proper progress merging ----
  const offeredArr = useMemo(() => {
    // First try to use server skills merged with progress
    if (server?.skills?.offered && Array.isArray(server.skills.offered)) {
      return mergeSkillsWithProgress(server.skills.offered, server.progress?.offered);
    }
    
    // Fallback to user data
    if (user?.skillsOffered && Array.isArray(user.skillsOffered)) {
      return mergeSkillsWithProgress(user.skillsOffered, user.progress?.offered);
    }
    
    // Last resort: just convert progress data to array
    return mapToArray(server?.progress?.offered) || 
           mapToArray(user?.progress?.offered) || 
           [];
  }, [server, user]);

  const learnedArr = useMemo(() => {
    // First try to use server skills merged with progress
    if (server?.skills?.learned && Array.isArray(server.skills.learned)) {
      return mergeSkillsWithProgress(server.skills.learned, server.progress?.learned);
    }
    
    // Fallback to user data
    if (user?.skillsWanted && Array.isArray(user.skillsWanted)) {
      return mergeSkillsWithProgress(user.skillsWanted, user.progress?.learned);
    }
    
    // Last resort: just convert progress data to array
    return mapToArray(server?.progress?.learned) || 
           mapToArray(user?.progress?.learned) || 
           [];
  }, [server, user]);

  const recent = useMemo(() => {
    return Array.isArray(server?.recent) ? server.recent : [];
  }, [server]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-50 to-white">
      <div className="container px-4 pt-24 pb-6 mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-3xl font-bold text-slate-900"
        >
          📈 Track Progress
        </motion.h1>
        <p className="mt-1 text-slate-600">
          Monitor your learning journey and skill-swap milestones.
        </p>

        {err && (
          <div className="px-4 py-3 mt-4 border rounded-xl border-rose-200 bg-rose-50 text-rose-800">
            {err}
          </div>
        )}

        {/* stats */}
        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
          <StatCard label="Swaps Completed" value={loading ? '—' : swapsCount} emoji="✅" />
          <StatCard label="Skills Offered (tracked)" value={loading ? '—' : offeredArr.length} emoji="🎯" />
          <StatCard label="Skills Learned (tracked)" value={loading ? '—' : learnedArr.length} emoji="🎓" />
        </div>

        {/* details */}
        <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SkillProgress
              title="Your Offered Skills Progress"
              items={offeredArr
                .filter(s => s?.name)
                .sort((a, b) => (b?.count || 0) - (a?.count || 0))}
            />
            <SkillProgress
              title="Your Learned Skills Progress"
              items={learnedArr
                .filter(s => s?.name)
                .sort((a, b) => (b?.count || 0) - (a?.count || 0))}
            />
          </div>
          <div className="lg:col-span-1">
            <RecentList items={recent} />
          </div>
        </div>
      </div>
    </div>
  );
}