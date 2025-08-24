import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { NavLink, useParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

  // Check password strength
  const checkPasswordStrength = (pwd) => {
    let score = 0;
    let feedback = '';

    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score === 0) feedback = '';
    else if (score <= 2) feedback = 'Weak';
    else if (score <= 4) feedback = 'Medium';
    else feedback = 'Strong';

    return { score, feedback };
  };

  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, feedback: '' });
    }
  }, [password]);

  // Enhanced validation
  const validate = () => {
    if (!password || password.length < 8) {
      setErr('Password must be at least 8 characters long.');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setErr('Password must contain at least one uppercase letter, lowercase letter, and number.');
      return false;
    }
    if (password !== confirm) {
      setErr('Passwords do not match.');
      return false;
    }
    return true;
  };

  // Rate limiting check
  const canSubmit = () => {
    const now = Date.now();
    const lastSubmit = localStorage.getItem('lastPasswordReset');
    if (lastSubmit && now - parseInt(lastSubmit) < 30000) { // 30 seconds
      setErr('Please wait before trying again.');
      return false;
    }
    if (submitCount >= 3) {
      setErr('Too many attempts. Please wait a few minutes.');
      return false;
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    if (!validate() || !canSubmit()) {
      return;
    }

    setLoading(true);
    setSubmitCount(prev => prev + 1);
    localStorage.setItem('lastPasswordReset', Date.now().toString());

    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const res = await axios.post(`${base}/api/auth/reset-password/${token}`, { password });
      
      const successMsg = res.data?.message || 'Password updated successfully!';
      setMsg(successMsg);
      
      // Clear form data
      setPassword('');
      setConfirm('');
      
      // Longer delay for better UX
      setTimeout(() => {
        setMsg('Redirecting to login...');
        setTimeout(() => navigate('/login'), 1000);
      }, 2500);
      
    } catch (e) {
      const errorMsg = e.response?.data?.message || 
                      (e.response?.status === 400 ? 'Invalid or expired reset link.' :
                       e.response?.status === 429 ? 'Too many requests. Please try again later.' :
                       'Something went wrong. Please try again.');
      setErr(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Early return if no token
  if (!token || token.trim() === '') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800">
        <motion.nav
          initial={{ y: -100, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.6 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b lg:p-6 bg-white/10 backdrop-blur-lg border-white/20"
        >
          <NavLink to="/" className="text-2xl font-bold text-white">SkillSwap</NavLink>
        </motion.nav>
        
        <div className="flex items-center justify-center min-h-screen px-4 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-8 text-center border shadow-2xl bg-white/10 backdrop-blur-xl rounded-2xl border-white/20"
          >
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mb-4 text-2xl font-bold text-white">Invalid Reset Link</h1>
            <p className="mb-6 text-white/80">This password reset link is invalid or has expired.</p>
            <NavLink 
              to="/login" 
              className="inline-block px-6 py-3 font-semibold text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Return to Login
            </NavLink>
          </motion.div>
        </div>
      </div>
    );
  }

  const getStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'text-red-400';
    if (passwordStrength.score <= 4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStrengthBarWidth = () => {
    return `${(passwordStrength.score / 6) * 100}%`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800">
      <motion.nav
        initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b lg:p-6 bg-white/10 backdrop-blur-lg border-white/20"
      >
        <NavLink to="/" className="text-2xl font-bold text-white">SkillSwap</NavLink>
        <NavLink to="/login" className="px-4 py-2 text-white transition-all duration-300 border rounded-lg border-white/30 hover:bg-white/10">
          Back to Login
        </NavLink>
      </motion.nav>

      <div className="flex items-center justify-center min-h-screen px-4 pt-24">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 border shadow-2xl bg-white/10 backdrop-blur-xl rounded-2xl border-white/20"
        >
          <h1 className="mb-2 text-3xl font-bold text-center text-white">Reset Password</h1>
          <p className="mb-8 text-center text-white/80">
            Choose a strong new password for your account.
          </p>

          {msg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 text-sm border text-emerald-100 rounded-xl bg-emerald-500/20 border-emerald-400/30"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                {msg}
              </div>
            </motion.div>
          )}
          
          {err && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 text-sm text-red-100 border rounded-xl bg-red-500/20 border-red-400/30"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {err}
              </div>
            </motion.div>
          )}

          {/* New password */}
          <label className="block mb-2 text-sm font-medium text-white/90">New Password</label>
          <div className="relative mb-3">
            <input
              type={showPass ? 'text' : 'password'}
              className="w-full p-4 text-white transition-all duration-300 border rounded-lg outline-none pr-11 bg-white/10 backdrop-blur-sm border-white/20 focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 placeholder-white/60"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute -translate-y-1/2 text-white/80 hover:text-white right-3 top-1/2"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Password strength indicator */}
          {password && (
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-white/70">Password Strength</span>
                <span className={`text-xs font-medium ${getStrengthColor()}`}>
                  {passwordStrength.feedback}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/20">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    passwordStrength.score <= 2 ? 'bg-red-500' :
                    passwordStrength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: getStrengthBarWidth() }}
                />
              </div>
            </div>
          )}

          {/* Confirm password */}
          <label className="block mb-2 text-sm font-medium text-white/90">Confirm Password</label>
          <div className="relative mb-6">
            <input
              type={showConfirm ? 'text' : 'password'}
              className="w-full p-4 text-white transition-all duration-300 border rounded-lg outline-none pr-11 bg-white/10 backdrop-blur-sm border-white/20 focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 placeholder-white/60"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute -translate-y-1/2 text-white/80 hover:text-white right-3 top-1/2"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Password requirements */}
          <div className="mb-4 text-xs text-white/70">
            <p className="mb-1">Password requirements:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>At least 8 characters long</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Include at least one number</li>
              <li>Special characters recommended</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="flex items-center justify-center w-full p-3 font-semibold text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>

          <div className="mt-4 text-center">
            <NavLink to="/login" className="text-sm text-indigo-200 transition-colors hover:text-white">
              Back to Sign In
            </NavLink>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

export default ResetPassword;