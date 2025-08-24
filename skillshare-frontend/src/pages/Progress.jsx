// src/pages/Progress.jsx
import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Target, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, icon: Icon, loading }) {
  return (
    <div className="p-5 duration-500 border shadow-sm rounded-2xl border-white/30 bg-white/60 backdrop-blur animate-in slide-in-from-bottom">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
      <div className="mt-1 text-3xl font-bold text-slate-900">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function SkillProgress({ title, items = [], loading }) {
  const safeItems = Array.isArray(items) ? items : [];
  const max = useMemo(() => {
    if (safeItems.length === 0) return 1;
    return Math.max(1, ...safeItems.map(i => i?.count || 0));
  }, [safeItems]);
  
  return (
    <div className="p-5 duration-500 border shadow-sm rounded-2xl border-white/30 bg-white/60 backdrop-blur animate-in slide-in-from-left">
      <div className="mb-4 text-sm font-semibold text-slate-800">{title}</div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">Loading...</span>
        </div>
      ) : safeItems.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mb-2 text-4xl">📚</div>
          <div className="text-sm text-slate-500">No skills tracked yet.</div>
          <div className="mt-1 text-xs text-slate-400">Start skill swapping to see progress!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {safeItems.map((item, idx) => {
            const pct = Math.round(((item?.count || 0) / max) * 100);
            const key = item?.name ? `${item.name}-${idx}` : `item-${idx}`;
            return (
              <div key={key} className="duration-300 animate-in slide-in-from-bottom" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item?.name || 'Unknown'}</span>
                  <span className="text-slate-500">{item?.count || 0} swaps</span>
                </div>
                <div className="w-full h-2 mt-1 overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className="h-full transition-all duration-700 ease-out rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
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

function RecentList({ items = [], loading }) {
  const safeItems = Array.isArray(items) ? items : [];
  
  if (loading) {
    return (
      <div className="p-5 duration-500 border shadow-sm rounded-2xl border-white/30 bg-white/60 backdrop-blur animate-in slide-in-from-right">
        <div className="mb-4 text-sm font-semibold text-slate-800">Recent Completed Swaps</div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!safeItems.length) {
    return (
      <div className="p-5 duration-500 border shadow-sm rounded-2xl border-white/30 bg-white/60 backdrop-blur animate-in slide-in-from-right">
        <div className="mb-4 text-sm font-semibold text-slate-800">Recent Completed Swaps</div>
        <div className="py-8 text-center">
          <div className="mb-2 text-4xl">🤝</div>
          <div className="text-sm text-slate-500">No completed swaps yet.</div>
          <div className="mt-1 text-xs text-slate-400">Complete your first swap to see it here!</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-5 duration-500 border shadow-sm rounded-2xl border-white/30 bg-white/60 backdrop-blur animate-in slide-in-from-right">
      <div className="mb-4 text-sm font-semibold text-slate-800">Recent Completed Swaps</div>
      <ul className="divide-y divide-slate-200/70">
        {safeItems.slice(0, 8).map((swap, index) => {
          const key = swap?._id || swap?.id || `swap-${index}`;
          return (
            <li key={key} className="py-3 duration-300 animate-in slide-in-from-bottom" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-center justify-between">
                <div className="text-slate-800">
                  <span className="font-medium">{swap?.skillOffered?.name || '—'}</span>
                  <span className="mx-2 text-slate-400">⇄</span>
                  <span className="font-medium">{swap?.skillRequested?.name || '—'}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {swap?.completedAt ? new Date(swap.completedAt).toLocaleDateString() : ''}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Data Processing Helpers ---------- */
const mapToArray = (objOrMap) => {
  if (!objOrMap) return [];
  
  try {
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

const mergeSkillsWithProgress = (skillsArray, progressData) => {
  if (!Array.isArray(skillsArray)) return [];
  
  const progressMap = {};
  if (progressData) {
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
    count: progressMap[skill.name] || skill.count || skill.swapsCount || 0
  }));
};

export default function Progress() {
  const { user, token } = useAuth();
  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    
    const fetchProgress = async () => {
      if (!user || !token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get(`${API}/api/progress`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          timeout: 10000 // 10 second timeout
        });
        
        if (!cancelled) {
          setProgressData(response.data);
        }
      } catch (err) {
        if (!cancelled && !controller.signal.aborted) {
          let errorMessage = 'Could not load progress data';
          
          if (err.response?.status === 401) {
            errorMessage = 'Session expired. Please log in again.';
          } else if (err.response?.status === 403) {
            errorMessage = 'Access denied. Please check your permissions.';
          } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
          } else if (err.code === 'ECONNABORTED') {
            errorMessage = 'Request timed out. Please try again.';
          } else if (!navigator.onLine) {
            errorMessage = 'No internet connection. Please check your network.';
          }
          
          setError(errorMessage);
          setProgressData(null);
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
  }, [API, user, token]);

  // Compute stats with proper fallbacks
  const swapsCount = useMemo(() => {
    return progressData?.swapsCount ?? 
           progressData?.progress?.swapsCount ?? 
           user?.progress?.swapsCount ?? 
           0;
  }, [progressData, user]);

  const offeredSkills = useMemo(() => {
    if (progressData?.skills?.offered && Array.isArray(progressData.skills.offered)) {
      return mergeSkillsWithProgress(progressData.skills.offered, progressData.progress?.offered);
    }
    
    if (user?.skillsOffered && Array.isArray(user.skillsOffered)) {
      return mergeSkillsWithProgress(user.skillsOffered, user.progress?.offered);
    }
    
    return mapToArray(progressData?.progress?.offered) || 
           mapToArray(user?.progress?.offered) || 
           [];
  }, [progressData, user]);

  const learnedSkills = useMemo(() => {
    if (progressData?.skills?.learned && Array.isArray(progressData.skills.learned)) {
      return mergeSkillsWithProgress(progressData.skills.learned, progressData.progress?.learned);
    }
    
    if (user?.skillsWanted && Array.isArray(user.skillsWanted)) {
      return mergeSkillsWithProgress(user.skillsWanted, user.progress?.learned);
    }
    
    return mapToArray(progressData?.progress?.learned) || 
           mapToArray(user?.progress?.learned) || 
           [];
  }, [progressData, user]);

  const recentSwaps = useMemo(() => {
    return Array.isArray(progressData?.recent) ? progressData.recent : [];
  }, [progressData]);

  if (!user) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-50 to-white">
        <div className="container px-4 pt-24 pb-6 mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h2 className="mb-2 text-xl font-semibold text-slate-900">Please Log In</h2>
              <p className="text-slate-600">You need to be logged in to view your progress.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-50 to-white">
      <div className="container px-4 pt-24 pb-6 mx-auto">
        <h1 className="text-3xl font-bold duration-500 text-slate-900 animate-in slide-in-from-top">
          📈 Track Progress
        </h1>
        <p className="mt-1 duration-500 delay-100 text-slate-600 animate-in slide-in-from-top">
          Monitor your learning journey and skill-swap milestones.
        </p>

        {error && (
          <div className="px-4 py-3 mt-4 duration-300 border rounded-xl border-rose-200 bg-rose-50 text-rose-800 animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
          <StatCard 
            label="Swaps Completed" 
            value={swapsCount} 
            icon={TrendingUp}
            loading={loading}
          />
          <StatCard 
            label="Skills Offered" 
            value={offeredSkills.length} 
            icon={Target}
            loading={loading}
          />
          <StatCard 
            label="Skills Learned" 
            value={learnedSkills.length} 
            icon={GraduationCap}
            loading={loading}
          />
        </div>

        {/* Progress Details */}
        <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SkillProgress
              title="Your Offered Skills Progress"
              items={offeredSkills
                .filter(skill => skill?.name)
                .sort((a, b) => (b?.count || 0) - (a?.count || 0))}
              loading={loading}
            />
            <SkillProgress
              title="Your Learned Skills Progress"
              items={learnedSkills
                .filter(skill => skill?.name)
                .sort((a, b) => (b?.count || 0) - (a?.count || 0))}
              loading={loading}
            />
          </div>
          <div className="lg:col-span-1">
            <RecentList items={recentSwaps} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}