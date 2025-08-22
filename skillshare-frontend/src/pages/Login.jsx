import { useState } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic form validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800">
      {/* Clean Navigation with SkillSwap branding */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b lg:p-6 bg-white/10 backdrop-blur-lg border-white/20"
      >
        <motion.div whileHover={{ scale: 1.05 }} className="text-2xl font-bold text-white cursor-pointer">
          <NavLink to="/" className="inline-flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 font-bold text-white rounded-md bg-gradient-to-r from-indigo-500 to-purple-600">S</span>
            <span>SkillSwap</span>
          </NavLink>
        </motion.div>

        <div className="items-center hidden space-x-8 md:flex">
          <NavLink to="/" className="transition-all duration-300 text-white/90 hover:text-white">Home</NavLink>
          <NavLink to="/about" className="transition-all duration-300 text-white/90 hover:text-white">About</NavLink>
          <NavLink to="/contact" className="transition-all duration-300 text-white/90 hover:text-white">Contact</NavLink>
        </div>

        <div className="flex items-center space-x-3">
          <NavLink to="/login" className="px-4 py-2 text-white transition-all duration-300 border rounded-lg border-white/30 hover:bg-white/10 backdrop-blur-sm">
            Log in
          </NavLink>
          <NavLink to="/register" className="px-4 py-2 text-white transition-all duration-300 bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl">
            Sign up
          </NavLink>
        </div>
      </motion.nav>

      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: [0, 360], y: [-20, 20, -20], x: [0, 10, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-32 h-32 rounded-full top-20 right-20 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20 blur-sm"
        />
        <motion.div
          animate={{ rotate: [360, 0], y: [10, -30, 10], x: [-5, 15, -5] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: -5 }}
          className="absolute w-24 h-24 rounded-full top-40 right-40 bg-gradient-to-r from-blue-400 to-purple-600 opacity-30 blur-sm"
        />
        <motion.div
          animate={{ rotate: [0, -360], y: [20, -10, 20], x: [10, -5, 10] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: -10 }}
          className="absolute w-40 h-40 rounded-full bottom-20 right-10 bg-gradient-to-r from-pink-500 to-red-500 opacity-15 blur-sm"
        />
        <motion.div
          animate={{ rotate: [180, -180], y: [-10, 25, -10], x: [5, -10, 5] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: -8 }}
          className="absolute rounded-full opacity-25 top-1/2 left-20 w-28 h-28 bg-gradient-to-r from-green-400 to-teal-500 blur-sm"
        />
      </div>

      {/* Split-screen layout - hero on left, login on right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex items-center justify-center min-h-screen px-4 pt-20"
      >
        <div className="grid items-center w-full gap-8 max-w-7xl lg:grid-cols-2 lg:gap-16">
          {/* Left: SkillSwap tagline / hero */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6 text-white lg:space-y-8 lg:text-left"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 text-sm rounded-full bg-white/10 backdrop-blur-sm">
              <span className="block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">SkillSwap — trade skills, build momentum</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
            >
              SkillSwap
              <span className="block text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">swap skills. level up.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="max-w-lg text-lg text-white/80"
            >
              Connect with people who’ll trade their expertise for yours. Quick swaps, real growth, zero noise.
            </motion.p>

            <div className="pt-6">
              <p className="text-sm text-white/70">Trusted by learners and builders worldwide.</p>
            </div>
          </motion.div>

          {/* Right: Glass-morphic login form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-center"
          >
            <motion.form
              onSubmit={handleSubmit}
              className="w-full max-w-md p-8 border shadow-2xl lg:p-10 bg-white/10 backdrop-blur-xl rounded-2xl border-white/20"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mb-8 text-3xl font-bold text-center text-white"
              >
                Login
              </motion.h2>

              {/* error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-4 mb-6 text-center text-red-100 border rounded-lg bg-red-500/20 border-red-400/30 backdrop-blur-sm"
                >
                  <motion.div animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 0.5 }}>
                    {error}
                  </motion.div>
                </motion.div>
              )}

              {/* loading */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-blue-400 rounded-full border-t-transparent"
                    />
                    <span className="font-medium text-blue-200">Logging in...</span>
                  </div>
                </motion.div>
              )}

              <div className="space-y-6">
                {/* Email */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.45 }}>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-white/90">Email</label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full p-4 text-white transition-all duration-300 border rounded-lg outline-none bg-white/10 backdrop-blur-sm border-white/20 focus:ring-2 focus:ring-indigo-400 focus:border-transparent focus:bg-white/15 disabled:opacity-50 placeholder-white/60 hover:bg-white/15"
                    disabled={loading}
                    required
                  />
                </motion.div>

                {/* Password + Eye Toggle */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.55 }}>
                  <label htmlFor="password" className="block mb-2 text-sm font-medium text-white/90">Password</label>
                  <div className="relative">
                    <motion.input
                      whileFocus={{ scale: 1.02 }}
                      type={showPass ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full p-4 text-white transition-all duration-300 border rounded-lg outline-none pr-11 bg-white/10 backdrop-blur-sm border-white/20 focus:ring-2 focus:ring-indigo-400 focus:border-transparent focus:bg-white/15 disabled:opacity-50 placeholder-white/60 hover:bg-white/15"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      className="absolute -translate-y-1/2 text-white/80 hover:text-white right-3 top-1/2"
                    >
                      {/* Simple inline SVG icons to avoid extra deps */}
                      {showPass ? (
                        // Eye-off
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7 0-1.07.436-2.101 1.23-3.037m3.04-2.64A9.956 9.956 0 0112 5c5 0 9 4 9 7 0 1.028-.418 2.028-1.176 2.957M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                        </svg>
                      ) : (
                        // Eye
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Forgot Password link */}
                  <div className="flex justify-end mt-2">
                    <NavLink to="/forgot-password" className="text-sm text-indigo-200 hover:text-white">
                      Forgot Password?
                    </NavLink>
                  </div>
                </motion.div>

                {/* Submit */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.65 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full p-4 font-semibold text-white transition-all duration-300 transform bg-indigo-600 rounded-lg shadow-lg disabled:opacity-50 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:shadow-xl"
                >
                  <motion.span animate={loading ? { opacity: [1, 0.5, 1] } : { opacity: 1 }} transition={loading ? { duration: 1.5, repeat: Infinity } : {}}>
                    {loading ? 'Logging in...' : 'Login'}
                  </motion.span>
                </motion.button>
              </div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.75 }} className="mt-6 text-center text-white/70">
                Don&apos;t have an account?{' '}
                <NavLink to="/register" className="font-semibold text-indigo-300 hover:text-indigo-200 hover:underline">
                  Register
                </NavLink>
              </motion.p>
            </motion.form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
