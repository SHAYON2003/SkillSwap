// src/pages/Register.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, animate } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ------------------ Constants ------------------ */
const ANIMATION_DELAYS = {
  SUCCESS_REDIRECT: 3000,
  MESSAGE_DISPLAY: 2500,
};

const RATE_LIMIT = {
  MAX_ATTEMPTS: 3,
  COOLDOWN_MS: 60000, // 1 minute
};

const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  PATTERNS: {
    UPPERCASE: /[A-Z]/,
    LOWERCASE: /[a-z]/,
    NUMBER: /\d/,
    SPECIAL: /[!@#$%^&*(),.?":{}|<>]/,
  },
};

/* ------------------ Decorative Background Helpers ------------------ */
function GradientBlobs() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none -z-20">
      <motion.div
        className="absolute rounded-full w-72 h-72 -top-24 -left-16 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(168,85,247,0.18), transparent)" }}
        animate={{ x: [-12, 10, -8], y: [0, 14, -10], rotate: [0, 8, -6] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute rounded-full w-80 h-80 right-6 top-28 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.14), transparent)" }}
        animate={{ x: [6, -18, 8], y: [-10, 12, -6], rotate: [0, -8, 10] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-56 h-56 rounded-full left-1/3 bottom-8 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(20,184,166,0.12), transparent)" }}
        animate={{ x: [0, 8, -6], y: [2, -10, 8] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
      {/* faint grid overlay */}
      <div
        className="absolute inset-0 opacity-10 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "26px 26px, 26px 26px",
        }}
      />
    </div>
  );
}

function FloatingDots({ count = 24 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 2,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 4,
      })),
    [count]
  );
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none -z-10">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-black/6"
          style={{ left: d.left, top: d.top, width: d.size, height: d.size, filter: "blur(0.4px)" }}
          animate={{ y: [-8, 8, -8], opacity: [0.12, 0.45, 0.12] }}
          transition={{ duration: d.duration, repeat: Infinity, delay: d.delay }}
        />
      ))}
    </div>
  );
}

function GeometricShapes() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none -z-10">
      <motion.div
        className="absolute w-12 h-12 border rounded-xl right-16 top-40 border-black/6 bg-white/6"
        animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.04, 0.98, 1] }}
        transition={{ repeat: Infinity, duration: 14 }}
      />
      <motion.div
        className="absolute w-10 h-10 border rounded-full left-10 bottom-32 border-black/6 bg-white/6"
        animate={{ y: [0, -6, 6, 0], scale: [1, 1.04, 0.96, 1] }}
        transition={{ repeat: Infinity, duration: 12 }}
      />
    </div>
  );
}

/* ------------------ Helper Functions ------------------ */
function sanitizeInput(input) {
  return input.trim().replace(/[<>]/g, '');
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function checkPasswordStrength(password) {
  let score = 0;
  let feedback = '';

  if (password.length >= PASSWORD_REQUIREMENTS.MIN_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (PASSWORD_REQUIREMENTS.PATTERNS.UPPERCASE.test(password)) score += 1;
  if (PASSWORD_REQUIREMENTS.PATTERNS.LOWERCASE.test(password)) score += 1;
  if (PASSWORD_REQUIREMENTS.PATTERNS.NUMBER.test(password)) score += 1;
  if (PASSWORD_REQUIREMENTS.PATTERNS.SPECIAL.test(password)) score += 1;

  if (score === 0) feedback = '';
  else if (score <= 2) feedback = 'Weak';
  else if (score <= 4) feedback = 'Medium';
  else feedback = 'Strong';

  return { score, feedback };
}

function canAttemptRegistration() {
  const lastAttempt = localStorage.getItem('lastRegisterAttempt');
  const attemptCount = parseInt(localStorage.getItem('registerAttempts') || '0');
  const now = Date.now();

  if (attemptCount >= RATE_LIMIT.MAX_ATTEMPTS) {
    if (lastAttempt && now - parseInt(lastAttempt) < RATE_LIMIT.COOLDOWN_MS) {
      return false;
    } else {
      // Reset attempts after cooldown
      localStorage.removeItem('registerAttempts');
      localStorage.removeItem('lastRegisterAttempt');
    }
  }
  return true;
}

function recordAttempt() {
  const attemptCount = parseInt(localStorage.getItem('registerAttempts') || '0');
  localStorage.setItem('registerAttempts', (attemptCount + 1).toString());
  localStorage.setItem('lastRegisterAttempt', Date.now().toString());
}

/* ------------------ Main Register Component ------------------ */
export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);

  const { register, user } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  // Real-time password strength checking
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    } else {
      setPasswordStrength({ score: 0, feedback: '' });
    }
  }, [formData.password]);

  // Real-time validation
  const validateField = (name, value) => {
    switch (name) {
      case 'username':
        if (!value.trim()) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (value.length > 30) return 'Username must be less than 30 characters';
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, hyphens, and underscores';
        return '';
      
      case 'email':
        if (!value) return 'Email is required';
        if (!validateEmail(value)) return 'Please enter a valid email address';
        return '';
      
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) return `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`;
        if (!PASSWORD_REQUIREMENTS.PATTERNS.UPPERCASE.test(value)) return 'Password must contain at least one uppercase letter';
        if (!PASSWORD_REQUIREMENTS.PATTERNS.LOWERCASE.test(value)) return 'Password must contain at least one lowercase letter';
        if (!PASSWORD_REQUIREMENTS.PATTERNS.NUMBER.test(value)) return 'Password must contain at least one number';
        return '';
      
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Real-time validation for touched fields
    if (touched[name]) {
      const error = validateField(name, sanitizedValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    
    setErrors(newErrors);
    setTouched({ username: true, email: true, password: true });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setSuccess("");
    
    // Check rate limiting
    if (!canAttemptRegistration()) {
      setErrors({ submit: 'Too many attempts. Please wait a minute before trying again.' });
      return;
    }

    // Validate form
    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField && formRef.current) {
        const field = formRef.current.querySelector(`[name="${firstErrorField}"]`);
        field?.focus();
      }
      return;
    }

    setLoading(true);
    setSubmitAttempts(prev => prev + 1);
    recordAttempt();

    try {
      await register(formData.username, formData.email, formData.password);
      
      // Clear form
      setFormData({ username: '', email: '', password: '' });
      setTouched({});
      setErrors({});
      
      // Set success message
      setSuccess("🎉 Registration successful! Welcome to SkillSwap!");
      
      // Mark as new user and redirect
      sessionStorage.setItem("justSignedUp", "1");
      
      // Longer delay for better UX
      setTimeout(() => {
        setSuccess("Redirecting to your dashboard...");
        setTimeout(() => {
          navigate("/home?new=1", { replace: true });
        }, 1000);
      }, ANIMATION_DELAYS.MESSAGE_DISPLAY);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          (err.response?.status === 409 ? 'An account with this email or username already exists' :
                           err.response?.status === 429 ? 'Too many registration attempts. Please try again later.' :
                           'Registration failed. Please try again.');
      
      setErrors({ submit: errorMessage });
      
      // Focus first field on error
      if (formRef.current) {
        const firstInput = formRef.current.querySelector('input');
        firstInput?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'text-red-500';
    if (passwordStrength.score <= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPasswordStrengthBarWidth = () => {
    return `${(passwordStrength.score / 6) * 100}%`;
  };

  const getPasswordStrengthBarColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const navigateToPath = (path) => {
    navigate(path);
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-gray-900 bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50">
      <GradientBlobs />
      <FloatingDots />
      <GeometricShapes />

      <header className="relative z-20">
        <nav className="container flex items-center justify-between px-6 py-4 mx-auto">
          <NavLink to="/" className="inline-flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 font-bold text-white rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">S</div>
            <div className="text-lg font-bold">SkillSwap</div>
          </NavLink>

          <div className="items-center hidden gap-6 md:flex">
            <NavLink to="/" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">Home</NavLink>
            <NavLink to="/about" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">About</NavLink>
            <NavLink to="/contact" className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">Contact</NavLink>
          </div>

          <div className="flex items-center gap-3">
            <NavLink to="/login" className="px-3 py-1 text-sm transition-colors rounded-md bg-white/80 hover:bg-white">Login</NavLink>
            <NavLink to="/register" className="px-3 py-1 text-sm text-white transition-colors bg-indigo-600 rounded-md hover:bg-indigo-700">Sign up</NavLink>
          </div>
        </nav>
      </header>

      <main className="container relative z-10 px-6 py-10 mx-auto">
        <section className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Hero/Tagline */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1 rounded-full bg-white/80 backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold">Welcome 👋 — Join the swap</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-extrabold leading-tight md:text-5xl"
            >
              <span className="block text-gray-900">SkillSwap</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-500 to-teal-400 text-3xl md:text-4xl font-extrabold animate-[gradientShift_6s_linear_infinite]">
                swap skills — level up together
              </span>
            </motion.h1>

            <p className="max-w-xl text-lg text-gray-700">
              Create a profile, list what you can teach, and request what you want to learn. Quick sessions, real results — zero gatekeeping.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <motion.button
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 text-white transition-shadow shadow-lg rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-xl"
                onClick={() => navigateToPath("/search")}
              >
                Find Skills
              </motion.button>

              <motion.button
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 text-gray-800 transition-all border border-gray-200 rounded-2xl bg-white/80 backdrop-blur hover:bg-white hover:shadow-md"
                onClick={() => navigateToPath("/share")}
              >
                Share Skills
              </motion.button>
            </div>

            {/* Feature cards */}
            <div className="grid gap-4 mt-8 sm:grid-cols-2">
              <motion.div 
                whileHover={{ y: -6 }} 
                className="p-4 transition-shadow border border-gray-200 shadow-sm rounded-2xl bg-white/80 backdrop-blur hover:shadow-md"
              >
                <h4 className="font-semibold text-gray-900">Quick Matches</h4>
                <p className="mt-1 text-sm text-gray-700">Get paired with a complementary skill in minutes.</p>
              </motion.div>
              <motion.div 
                whileHover={{ y: -6 }} 
                className="p-4 transition-shadow border border-gray-200 shadow-sm rounded-2xl bg-white/80 backdrop-blur hover:shadow-md"
              >
                <h4 className="font-semibold text-gray-900">Transparent Ratings</h4>
                <p className="mt-1 text-sm text-gray-700">Real feedback keeps swaps trustworthy and helpful.</p>
              </motion.div>
            </div>
          </div>

          {/* Right: Register Form */}
          <motion.form
            ref={formRef}
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md p-8 mx-auto border border-gray-200 shadow-xl rounded-3xl bg-white/90 backdrop-blur-lg"
            noValidate
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                <p className="mt-1 text-sm text-gray-600">Join thousands swapping skills right now.</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-gray-800">Live</span>
              </div>
            </div>

            {/* Global error message */}
            {errors.submit && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-3 mb-4 border rounded-lg bg-rose-50 border-rose-200"
              >
                <div className="flex items-center text-rose-700">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.submit}
                </div>
              </motion.div>
            )}

            {/* Success message */}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-3 mb-4 border rounded-lg bg-emerald-50 border-emerald-200"
              >
                <div className="flex items-center text-emerald-700">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {success}
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Username field */}
              <div>
                <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700">
                  Username *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Choose a username"
                  className={`w-full p-3 border rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.username ? 'border-rose-300 focus:ring-rose-500' : 'border-gray-200'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading}
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  required
                />
                {errors.username && (
                  <p id="username-error" className="mt-1 text-sm text-rose-600" role="alert">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Email field */}
              <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="you@domain.com"
                  className={`w-full p-3 border rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.email ? 'border-rose-300 focus:ring-rose-500' : 'border-gray-200'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  required
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-rose-600" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="At least 8 characters"
                    className={`w-full p-3 pr-12 border rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      errors.password ? 'border-rose-300 focus:ring-rose-500' : 'border-gray-200'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                    aria-describedby={errors.password ? 'password-error' : 'password-strength'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute text-gray-500 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div id="password-strength" className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password Strength</span>
                      <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                        {passwordStrength.feedback}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthBarColor()}`}
                        style={{ width: getPasswordStrengthBarWidth() }}
                      />
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm text-rose-600" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Password requirements */}
            <div className="p-3 mt-4 text-xs text-gray-600 rounded-lg bg-gray-50">
              <p className="mb-1 font-medium">Password requirements:</p>
              <ul className="space-y-1">
                <li className="flex items-center">
                  <span className={`mr-2 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                    {formData.password.length >= 8 ? '✓' : '○'}
                  </span>
                  At least 8 characters
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${PASSWORD_REQUIREMENTS.PATTERNS.UPPERCASE.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                    {PASSWORD_REQUIREMENTS.PATTERNS.UPPERCASE.test(formData.password) ? '✓' : '○'}
                  </span>
                  One uppercase letter
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${PASSWORD_REQUIREMENTS.PATTERNS.LOWERCASE.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                    {PASSWORD_REQUIREMENTS.PATTERNS.LOWERCASE.test(formData.password) ? '✓' : '○'}
                  </span>
                  One lowercase letter
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${PASSWORD_REQUIREMENTS.PATTERNS.NUMBER.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                    {PASSWORD_REQUIREMENTS.PATTERNS.NUMBER.test(formData.password) ? '✓' : '○'}
                  </span>
                  One number
                </li>
              </ul>
            </div>

            <motion.button
              type="submit"
              whileHover={!loading ? { y: -2, scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              disabled={loading || Object.keys(errors).length > 0}
              className="flex items-center justify-center w-full px-4 py-3 mt-6 font-semibold text-white transition-all shadow-lg rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>

            <p className="mt-4 text-sm text-center text-gray-600">
              Already have an account?{" "}
              <NavLink to="/login" className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700 hover:underline">
                Sign in
              </NavLink>
            </p>

            {/* Terms and Privacy */}
            <p className="mt-3 text-xs text-center text-gray-500">
              By creating an account, you agree to our{" "}
              <button 
                type="button"
                onClick={() => navigateToPath("/terms")}
                className="text-indigo-600 hover:underline"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button 
                type="button"
                onClick={() => navigateToPath("/privacy")}
                className="text-indigo-600 hover:underline"
              >
                Privacy Policy
              </button>
            </p>
          </motion.form>
        </section>
      </main>

      <footer className="relative z-10 py-8 text-center">
        <small className="text-sm text-gray-600">© {new Date().getFullYear()} SkillSwap — Built for creators & learners</small>
      </footer>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        .animate-[gradientShift_6s_linear_infinite] {
          background-size: 200% 200%;
          animation: gradientShift 6s linear infinite;
        }
      `}</style>
    </div>
  );
}