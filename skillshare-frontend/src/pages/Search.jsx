import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Search() {
  const [skill, setSkill] = useState('');
  const [type, setType] = useState('offered'); // 'offered' | 'wanted'
  const [users, setUsers] = useState([]); // can hold user profiles OR public requests
  const [mode, setMode] = useState('skill'); // 'skill' | 'matches'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const searchUsers = async () => {
    console.log('\n🔍 === FRONTEND SEARCH DEBUG START ===');
    console.log('Search params:', { skill: skill.trim(), type, mode });

    setError('');
    if (mode === 'skill' && !skill.trim()) {
      setError('Please enter a skill to search for.');
      return;
    }

    setLoading(true);
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:4000';

      if (mode === 'skill') {
        const qSkill = encodeURIComponent(skill.trim());
        // Backend should map: offered -> skillOffered.name, wanted -> skillRequested.name
        const url = `${base}/api/requests/public?skill=${qSkill}&type=${encodeURIComponent(type)}`;
        console.log('Making request to:', url);

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        console.log('Response status:', res.status);
        console.log('Response data:', res.data);

        const payload = res.data;
        const list = payload?.results || payload?.users || payload?.requests || [];
        setUsers(Array.isArray(list) ? list : []);
      } else {
        const url = `${base}/api/match/compatible`;
        console.log('Making compatible request to:', url);

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        console.log('Compatible response:', res.data);
        const payload = res.data;
        const list = payload?.results || payload?.users || payload || [];
        setUsers(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('❌ SEARCH ERROR:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        console.error('Response data:', err.response.data);
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server — check server connection.');
      } else {
        console.error('Request setup error:', err.message);
        setError(err.message || 'Search failed');
      }
      setUsers([]);
    } finally {
      setLoading(false);
      console.log('🔍 === FRONTEND SEARCH DEBUG END ===\n');
    }
  };

  useEffect(() => {
    if (mode === 'matches') {
      // auto-run matches mode
      searchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const sendRequest = async (toUserId) => {
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/requests/create`,
        { to: toUserId, skillOffered: { name: 'Your Skill' }, skillRequested: { name: 'Their Skill' } },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setError('Request sent successfully'); // your UI already shows green when msg contains "successfully"
    } catch (err) {
      console.error('Request error full:', err);
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Claim a public (open) request from the Search grid
  const claimPublic = async (requestId) => {
    setError('');
    setLoading(true);
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      await axios.post(
        `${base}/api/requests/${requestId}/claim`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // Remove claimed request from grid
      setUsers((prev) => (Array.isArray(prev) ? prev.filter((x) => x._id !== requestId) : []));
      setError('Claimed successfully'); // shows as green
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim post');
      console.error('Claim error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && mode === 'skill') {
      e.preventDefault();
      searchUsers();
    }
  };

  // Floating dots positions
  const floatingDots = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5
  }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-blue-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 120, 0], y: [0, -80, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute rounded-full top-32 left-16 w-72 h-72 bg-gradient-to-br from-blue-300/25 to-teal-300/25 blur-xl"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 120, 0], rotate: [0, -180, -360] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute w-56 h-56 rounded-full top-20 right-24 bg-gradient-to-br from-purple-300/30 to-pink-300/30 blur-xl"
        />
        <motion.div
          animate={{ x: [0, 90, 0], y: [0, -90, 0], rotate: [0, 90, 180] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute rounded-full bottom-40 left-1/4 w-80 h-80 bg-gradient-to-br from-teal-200/20 to-blue-200/20 blur-xl"
        />
        <motion.div animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute w-20 h-20 rotate-45 border-2 top-1/3 left-1/5 border-blue-200/40" />
        <motion.div animate={{ rotate: [0, -360], scale: [1, 0.8, 1] }} transition={{ duration: 16, repeat: Infinity, ease: "linear" }} className="absolute w-24 h-24 border-2 rounded-full bottom-1/4 right-1/3 border-purple-200/40" />
        <motion.div animate={{ rotate: [0, 180], scale: [1, 1.1, 1] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute w-16 h-16 border-2 top-2/3 right-1/5 border-teal-200/40" />
        {floatingDots.map((dot) => (
          <motion.div
            key={dot.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], y: [0, -40, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 5, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
            className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
            style={{ left: `${dot.x}%`, top: `${dot.y}%`, width: `${dot.size}px`, height: `${dot.size}px` }}
          />
        ))}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="container relative z-10 p-4 pt-20 mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 150 }} className="inline-flex items-center gap-2 px-4 py-2 mb-6 border rounded-full shadow-lg bg-white/30 backdrop-blur-md border-white/20">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-3 h-3 bg-blue-400 rounded-full" />
            <span className="text-sm font-medium text-gray-700">🔍 Discover Skills</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="mb-4 text-4xl font-bold md:text-6xl">
            <motion.span animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-300% bg-clip-text text-transparent">Find Your Perfect</motion.span>
            <br />
            <motion.span animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 0.5 }} className="bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-300% bg-clip-text text-transparent">Learning Match</motion.span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="max-w-2xl mx-auto text-xl text-gray-600">Connect with skilled individuals and discover amazing learning opportunities in your area.</motion.p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl backdrop-blur-md border shadow-lg ${
              error.includes('successfully')
                ? 'bg-green-50/80 border-green-200 text-green-800'
                : 'bg-red-50/80 border-red-200 text-red-800'
            }`}
          >
            {error}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="p-8 mb-8 transition-all duration-300 border shadow-xl bg-white/40 backdrop-blur-lg border-white/20 rounded-3xl hover:shadow-2xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 mb-4 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode(mode === 'skill' ? 'matches' : 'skill')}
                className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
                  mode === 'skill'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl'
                }`}
              >
                {mode === 'skill' ? (
                  <span className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>Show Smart Matches
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="text-xl">🔍</span>Search by Skill
                  </span>
                )}
              </motion.button>
              {loading && (
                <div className="flex items-center gap-3 px-6 py-4 bg-white/50 backdrop-blur-sm rounded-2xl">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-blue-200 rounded-full border-3 border-t-blue-600" />
                  <span className="font-medium text-blue-700">{mode === 'skill' ? 'Searching...' : 'Finding matches...'}</span>
                </div>
              )}
            </div>

            {mode === 'skill' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter skill (e.g., Python, Guitar)"
                    className="p-4 text-gray-800 placeholder-gray-500 transition-all duration-300 border outline-none md:col-span-2 bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />

                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="p-4 text-gray-800 transition-all duration-300 border outline-none bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="offered">I can teach this (find learners)</option>
                    <option value="wanted">I want to learn this (find teachers)</option>
                  </select>

                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={searchUsers}
                    className="flex items-center justify-center gap-2 p-4 font-semibold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !skill.trim()}
                  >
                    <span className="text-xl">🔍</span> Search
                  </motion.button>
                </div>

                {/* Helper text to explain the search logic */}
                <div className="px-4 py-2 text-sm text-gray-600 border bg-blue-50/80 backdrop-blur-sm rounded-xl border-blue-200/50">
                  <span className="font-medium">💡 Smart Search:</span>
                  {type === 'offered'
                    ? ' Finding people who want to learn this skill from you'
                    : ' Finding people who can teach you this skill'}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}>
          {(Array.isArray(users) ? users : []).length === 0 && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-16 text-center">
              <div className="mb-4 text-6xl">🤔</div>
              <h3 className="mb-2 text-2xl font-bold text-gray-700">
                {mode === 'skill' ? 'No results found' : 'No matches available'}
              </h3>
              <p className="max-w-md mx-auto text-gray-500">
                {mode === 'skill'
                  ? 'Try searching for different skills or check the spelling.'
                  : 'Complete your profile with skills to find better matches.'}
              </p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(Array.isArray(users) ? users : []).map((u, index) => {
              // Determine if this item is a public request (from /api/requests/public)
              const isRequest = !!u?.from || u?.visibility === 'public' || !!u?.skillOffered || !!u?.skillRequested;

              // Normalize display name & email
              const displayName = isRequest
                ? (u?.from?.username || u?.from?.name || 'Unknown')
                : (u?.username || u?.name || 'Unknown');

              const displayEmail = isRequest ? (u?.from?.email || '') : (u?.email || '');

              return (
                <motion.div
                  key={u._id || u.id || index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="p-6 transition-all duration-300 border shadow-xl bg-white/40 backdrop-blur-lg border-white/20 rounded-3xl hover:shadow-2xl group"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="relative">
                      <div className="flex items-center justify-center w-16 h-16 shadow-lg bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
                        <span className="text-2xl font-bold text-white">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute w-5 h-5 bg-green-400 border-2 border-white rounded-full -top-1 -right-1"
                      />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 transition-colors duration-300 group-hover:text-blue-600">
                        {displayName}
                      </h3>
                      <p className="text-sm text-gray-600">{displayEmail}</p>

                      {isRequest && (
                        <div className="mt-1 text-xs">
                          <span className="px-2 py-0.5 mr-2 font-medium text-indigo-700 bg-indigo-100 rounded-full">
                            Public
                          </span>
                          <span className="px-2 py-0.5 font-medium text-emerald-700 bg-emerald-100 rounded-full">
                            {u?.type === 'offer' ? 'Offering' : 'Wants to learn'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-6 space-y-4">
                    <div>
                      <h4 className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <span className="text-green-500">🎯</span>Skills Offered
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {isRequest ? (
                          u?.skillOffered?.name ? (
                            <span className="px-2 py-1 text-xs font-medium text-green-700 rounded-full bg-green-100/80">
                              {u.skillOffered.name}
                            </span>
                          ) : (
                            <span className="text-xs italic text-gray-400">None listed</span>
                          )
                        ) : Array.isArray(u?.skillsOffered) && u.skillsOffered.length > 0 ? (
                          u.skillsOffered.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs font-medium text-green-700 rounded-full bg-green-100/80">
                              {typeof s === 'string' ? s : s?.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs italic text-gray-400">None listed</span>
                        )}
                        {!isRequest &&
                          Array.isArray(u?.skillsOffered) &&
                          u.skillsOffered.length > 3 && (
                            <span className="px-2 py-1 text-xs font-medium text-gray-600 rounded-full bg-gray-100/80">
                              +{u.skillsOffered.length - 3} more
                            </span>
                          )}
                      </div>
                    </div>

                    <div>
                      <h4 className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                        <span className="text-blue-500">🎓</span>Skills Wanted
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {isRequest ? (
                          u?.skillRequested?.name ? (
                            <span className="px-2 py-1 text-xs font-medium text-blue-700 rounded-full bg-blue-100/80">
                              {u.skillRequested.name}
                            </span>
                          ) : (
                            <span className="text-xs italic text-gray-400">None listed</span>
                          )
                        ) : Array.isArray(u?.skillsWanted) && u.skillsWanted.length > 0 ? (
                          u.skillsWanted.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs font-medium text-blue-700 rounded-full bg-blue-100/80">
                              {typeof s === 'string' ? s : s?.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs italic text-gray-400">None listed</span>
                        )}
                        {!isRequest &&
                          Array.isArray(u?.skillsWanted) &&
                          u.skillsWanted.length > 3 && (
                            <span className="px-2 py-1 text-xs font-medium text-gray-600 rounded-full bg-gray-100/80">
                              +{u.skillsWanted.length - 3} more
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isRequest ? (
                    // User profile -> Send Request
                    u?._id !== user?.id ? (
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => sendRequest(u._id)}
                        className="flex items-center justify-center w-full gap-2 p-3 font-semibold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white rounded-full border-t-transparent"
                          />
                        ) : (
                          <>
                            <span className="text-lg">🤝</span>Send Request
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <div className="w-full p-3 font-medium text-center text-gray-500 bg-gray-100/80 rounded-2xl">
                        <span className="flex items-center justify-center gap-2">
                          <span className="text-lg">👤</span>This is you
                        </span>
                      </div>
                    )
                  ) : (
                    // Public request -> Claim Post
                    (u?.from?._id || u?.from?.id) !== user?.id ? (
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => claimPublic(u._id)}
                        className="flex items-center justify-center w-full gap-2 p-3 font-semibold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white rounded-full border-t-transparent"
                          />
                        ) : (
                          <>
                            <span className="text-lg">📌</span> Claim Post
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <div className="w-full p-3 font-medium text-center text-gray-500 bg-gray-100/80 rounded-2xl">
                        <span className="flex items-center justify-center gap-2">
                          <span className="text-lg">📝</span>Your public post
                        </span>
                      </div>
                    )
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed z-50 flex items-center justify-center text-white transition-all duration-300 rounded-full shadow-lg bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl"
        >
          <span className="text-xl">↑</span>
        </motion.button>
      </motion.div>

      <style>{`
        .bg-grid-pattern {
          background-image: radial-gradient(circle at 25px 25px, rgba(0,0,0,0.1) 2px, transparent 0);
          background-size: 50px 50px;
        }
        .bg-300% {
          background-size: 300% 300%;
        }
        .border-3 { border-width: 3px; }
      `}</style>
    </div>
  );
}

export default Search;
