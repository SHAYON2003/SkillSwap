import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Search() {
  const [skill, setSkill] = useState('');
  const [type, setType] = useState('offered');
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState('skill');
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
      searchUsers();
    }
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
      setError('Request sent successfully');
    } catch (err) {
      console.error('Request error full:', err);
      setError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

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
      setUsers((prev) => (Array.isArray(prev) ? prev.filter((x) => x._id !== requestId) : []));
      setError('Claimed successfully');
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Advanced Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Animated gradient orbs */}
        <div className="absolute rounded-full top-20 left-10 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute rounded-full top-40 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute rounded-full bottom-20 left-1/3 w-96 h-96 bg-gradient-to-r from-teal-400/20 to-blue-400/20 mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        
        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 p-6 pt-24 mx-auto">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 mb-8 border rounded-full shadow-lg bg-white/20 backdrop-blur-xl border-white/30">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
            <span className="text-sm font-semibold tracking-wide text-gray-700">🚀 SKILL DISCOVERY PLATFORM</span>
          </div>
          
          <h1 className="mb-6 text-5xl font-black tracking-tight md:text-7xl">
            <span className="text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text animate-pulse">
              Master New Skills
            </span>
            <br />
            <span className="text-transparent bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text">
              Connect & Grow
            </span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-xl leading-relaxed text-gray-600">
            Discover talented individuals in your network and unlock endless learning opportunities through meaningful skill exchanges.
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border-2 shadow-xl transform transition-all duration-300 ${
            error.includes('successfully')
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : 'bg-red-50/80 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{error.includes('successfully') ? '✅' : '❌'}</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Advanced Search Interface */}
        <div className="p-8 mb-12 border shadow-2xl bg-white/30 backdrop-blur-2xl border-white/20 rounded-3xl">
          <div className="flex flex-col gap-6">
            {/* Mode Toggle */}
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <button
                onClick={() => setMode(mode === 'skill' ? 'matches' : 'skill')}
                className={`group relative px-8 py-4 rounded-2xl font-bold text-white overflow-hidden transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ${
                  mode === 'skill'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600'
                }`}
              >
                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-white/20 to-transparent group-hover:opacity-100"></div>
                <span className="relative flex items-center gap-3">
                  {mode === 'skill' ? (
                    <>
                      <span className="text-xl">🎯</span>
                      Show Smart Matches
                    </>
                  ) : (
                    <>
                      <span className="text-xl">🔍</span>
                      Search by Skill
                    </>
                  )}
                </span>
              </button>

              {loading && (
                <div className="flex items-center gap-4 px-8 py-4 border shadow-lg bg-white/40 backdrop-blur-lg rounded-2xl border-white/30">
                  <div className="relative">
                    <div className="w-8 h-8 border-4 border-blue-200 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-8 h-8 border-4 border-transparent rounded-full border-t-blue-600 animate-spin"></div>
                  </div>
                  <span className="text-lg font-semibold text-blue-700">
                    {mode === 'skill' ? 'Searching...' : 'Finding matches...'}
                  </span>
                </div>
              )}
            </div>

            {/* Skill Search Form */}
            {mode === 'skill' && (
              <div className="space-y-6 duration-500 animate-in slide-in-from-top">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {/* Skill Input */}
                  <div className="relative md:col-span-2 group">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter skill (e.g., Python, Guitar, Photography)"
                      className="w-full p-5 text-lg font-medium text-gray-800 placeholder-gray-400 transition-all duration-300 border-2 outline-none bg-white/60 backdrop-blur-lg border-white/30 rounded-2xl focus:border-blue-400 focus:bg-white/80 focus:shadow-xl group-hover:border-blue-300"
                      disabled={loading}
                    />
                    <div className="absolute inset-y-0 flex items-center pointer-events-none right-4">
                      <span className="text-2xl">🔍</span>
                    </div>
                  </div>

                  {/* Type Selection */}
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="p-5 text-lg font-medium text-gray-800 transition-all duration-300 border-2 outline-none bg-white/60 backdrop-blur-lg border-white/30 rounded-2xl focus:border-blue-400 focus:bg-white/80 focus:shadow-xl hover:border-blue-300"
                    disabled={loading}
                  >
                    <option value="offered">🎯 I can teach this (find learners)</option>
                    <option value="wanted">🎓 I want to learn this (find teachers)</option>
                  </select>

                  {/* Search Button */}
                  <button
                    onClick={searchUsers}
                    disabled={loading || !skill.trim()}
                    className="relative px-6 py-5 overflow-hidden font-bold text-white transition-all duration-300 transform group bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-white/20 to-transparent group-hover:opacity-100"></div>
                    <span className="relative flex items-center justify-center gap-3">
                      <span className="text-xl">🚀</span>
                      <span className="text-lg">Search</span>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="duration-700 animate-in fade-in">
          {/* No Results State */}
          {(Array.isArray(users) ? users : []).length === 0 && !loading && (
            <div className="py-20 text-center border shadow-xl bg-white/20 backdrop-blur-lg rounded-3xl border-white/30">
              <div className="mb-6 text-8xl animate-bounce">🤔</div>
              <h3 className="mb-4 text-3xl font-bold text-gray-700">
                {mode === 'skill' ? 'No results found' : 'No matches available'}
              </h3>
              <p className="max-w-md mx-auto text-xl text-gray-500">
                {mode === 'skill'
                  ? 'Try searching for different skills or check the spelling.'
                  : 'Complete your profile with skills to find better matches.'}
              </p>
            </div>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {(Array.isArray(users) ? users : []).map((u, index) => {
              const isRequest = !!u?.from || u?.visibility === 'public' || !!u?.skillOffered || !!u?.skillRequested;
              const displayName = isRequest
                ? (u?.from?.username || u?.from?.name || 'Unknown')
                : (u?.username || u?.name || 'Unknown');
              const displayEmail = isRequest ? (u?.from?.email || '') : (u?.email || '');

              return (
                <div
                  key={u._id || u.id || index}
                  className="relative p-8 transition-all duration-500 border shadow-xl group bg-white/30 backdrop-blur-2xl border-white/20 rounded-3xl hover:shadow-2xl hover:scale-105 hover:bg-white/40"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl group-hover:opacity-100"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* User Header */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="relative">
                        <div className="flex items-center justify-center w-20 h-20 transition-transform duration-300 transform shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl group-hover:scale-110">
                          <span className="text-3xl font-bold text-white">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute w-6 h-6 border-white rounded-full -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 border-3 animate-pulse"></div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="mb-1 text-2xl font-bold text-gray-800 transition-colors duration-300 group-hover:text-blue-600">
                          {displayName}
                        </h3>
                        <p className="text-sm font-medium text-gray-600">{displayEmail}</p>
                        
                        {isRequest && (
                          <div className="flex gap-2 mt-2">
                            <span className="px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200 rounded-full bg-indigo-100/80">
                              📢 Public
                            </span>
                            <span className="px-3 py-1 text-xs font-bold border rounded-full text-emerald-700 bg-emerald-100/80 border-emerald-200">
                              {u?.type === 'offer' ? '🎯 Offering' : '🎓 Learning'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Skills Section */}
                    <div className="mb-8 space-y-6">
                      {/* Skills Offered */}
                      <div>
                        <h4 className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-700">
                          <span className="text-lg">🎯</span>Skills Offered
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {isRequest ? (
                            u?.skillOffered?.name ? (
                              <span className="px-4 py-2 text-sm font-bold text-green-700 border border-green-200 shadow-sm bg-green-100/80 rounded-xl">
                                {u.skillOffered.name}
                              </span>
                            ) : (
                              <span className="text-sm italic font-medium text-gray-400">None listed</span>
                            )
                          ) : Array.isArray(u?.skillsOffered) && u.skillsOffered.length > 0 ? (
                            <>
                              {u.skillsOffered.slice(0, 3).map((s, idx) => (
                                <span key={idx} className="px-4 py-2 text-sm font-bold text-green-700 transition-transform duration-200 transform border border-green-200 shadow-sm bg-green-100/80 rounded-xl hover:scale-105">
                                  {typeof s === 'string' ? s : s?.name}
                                </span>
                              ))}
                              {u.skillsOffered.length > 3 && (
                                <span className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 shadow-sm bg-gray-100/80 rounded-xl">
                                  +{u.skillsOffered.length - 3} more
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm italic font-medium text-gray-400">None listed</span>
                          )}
                        </div>
                      </div>

                      {/* Skills Wanted */}
                      <div>
                        <h4 className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-700">
                          <span className="text-lg">🎓</span>Skills Wanted
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {isRequest ? (
                            u?.skillRequested?.name ? (
                              <span className="px-4 py-2 text-sm font-bold text-blue-700 border border-blue-200 shadow-sm bg-blue-100/80 rounded-xl">
                                {u.skillRequested.name}
                              </span>
                            ) : (
                              <span className="text-sm italic font-medium text-gray-400">None listed</span>
                            )
                          ) : Array.isArray(u?.skillsWanted) && u.skillsWanted.length > 0 ? (
                            <>
                              {u.skillsWanted.slice(0, 3).map((s, idx) => (
                                <span key={idx} className="px-4 py-2 text-sm font-bold text-blue-700 transition-transform duration-200 transform border border-blue-200 shadow-sm bg-blue-100/80 rounded-xl hover:scale-105">
                                  {typeof s === 'string' ? s : s?.name}
                                </span>
                              ))}
                              {u.skillsWanted.length > 3 && (
                                <span className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 shadow-sm bg-gray-100/80 rounded-xl">
                                  +{u.skillsWanted.length - 3} more
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm italic font-medium text-gray-400">None listed</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!isRequest ? (
                      u?._id !== user?.id ? (
                        <button
                          onClick={() => sendRequest(u._id)}
                          disabled={loading}
                          className="relative w-full px-6 py-4 overflow-hidden font-bold text-white transition-all duration-300 transform group bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-white/20 to-transparent group-hover:opacity-100"></div>
                          <span className="relative flex items-center justify-center gap-3">
                            {loading ? (
                              <div className="w-6 h-6 rounded-full border-3 border-white/30 border-t-white animate-spin"></div>
                            ) : (
                              <>
                                <span className="text-xl">🤝</span>
                                <span className="text-lg">Send Request</span>
                              </>
                            )}
                          </span>
                        </button>
                      ) : (
                        <div className="w-full p-4 font-bold text-center text-gray-500 border-2 border-gray-200 bg-gray-100/80 rounded-2xl">
                          <span className="flex items-center justify-center gap-3">
                            <span className="text-xl">👤</span>
                            <span className="text-lg">This is you</span>
                          </span>
                        </div>
                      )
                    ) : (
                      (u?.from?._id || u?.from?.id) !== user?.id ? (
                        <button
                          onClick={() => claimPublic(u._id)}
                          disabled={loading}
                          className="relative w-full px-6 py-4 overflow-hidden font-bold text-white transition-all duration-300 transform group bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-white/20 to-transparent group-hover:opacity-100"></div>
                          <span className="relative flex items-center justify-center gap-3">
                            {loading ? (
                              <div className="w-6 h-6 rounded-full border-3 border-white/30 border-t-white animate-spin"></div>
                            ) : (
                              <>
                                <span className="text-xl">📌</span>
                                <span className="text-lg">Claim Post</span>
                              </>
                            )}
                          </span>
                        </button>
                      ) : (
                        <div className="w-full p-4 font-bold text-center text-gray-500 border-2 border-gray-200 bg-gray-100/80 rounded-2xl">
                          <span className="flex items-center justify-center gap-3">
                            <span className="text-xl">📝</span>
                            <span className="text-lg">Your public post</span>
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed z-50 w-16 h-16 text-white transition-all duration-300 transform shadow-2xl bottom-8 right-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:shadow-3xl hover:scale-110 group"
        >
          <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-white/20 to-transparent group-hover:opacity-100 rounded-2xl"></div>
          <span className="relative text-2xl font-bold">↑</span>
        </button>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes animate-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-in {
          animation: animate-in 0.6s ease-out;
        }
        
        .slide-in-from-top {
          animation: slide-in-from-top 0.5s ease-out;
        }
        
        @keyframes slide-in-from-top {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .border-3 { 
          border-width: 3px; 
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
      }
      
export default Search