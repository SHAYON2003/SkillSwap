import { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const validateEmail = (emailValue) => {
    if (!emailValue) return 'Email or username is required';
    // Allow both email and username formats
    if (emailValue.includes('@') && !/\S+@\S+\.\S+/.test(emailValue)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (passwordValue) => {
    if (!passwordValue) return 'Password is required';
    if (passwordValue.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');
    setError('');
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError('');
    setError('');
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate fields
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    if (emailValidation || passwordValidation) {
      return;
    }

    if (!auth?.login) {
      setError('Authentication service is unavailable');
      return;
    }

    setLoading(true);
    try {
      // Determine if input is email or username
      const isEmail = email.includes('@');
      const loginData = {
        password,
        ...(isEmail ? { email } : { username: email })
      };
      
      await auth.login(loginData);
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle different error response formats
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.response?.data?.message) {
        // Axios error format
        errorMessage = err.response.data.message;
      } else if (err.message) {
        // Generic error format
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800">
      {/* Clean Navigation with SkillSwap branding */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b lg:p-6 bg-white/10 backdrop-blur-lg border-white/20 animate-in slide-in-from-top duration-600">
        <div className="text-2xl font-bold text-white transition-transform cursor-pointer hover:scale-105">
          <NavLink to="/" className="inline-flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 font-bold text-white rounded-md bg-gradient-to-r from-indigo-500 to-purple-600">S</span>
            <span>SkillSwap</span>
          </NavLink>
        </div>

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
      </nav>

      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-32 h-32 rounded-full top-20 right-20 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20 blur-sm animate-pulse" style={{
          animation: 'float 20s infinite ease-in-out'
        }} />
        <div className="absolute w-24 h-24 rounded-full top-40 right-40 bg-gradient-to-r from-blue-400 to-purple-600 opacity-30 blur-sm animate-pulse" style={{
          animation: 'float 15s infinite ease-in-out reverse',
          animationDelay: '-5s'
        }} />
        <div className="absolute w-40 h-40 rounded-full bottom-20 right-10 bg-gradient-to-r from-pink-500 to-red-500 opacity-15 blur-sm animate-pulse" style={{
          animation: 'float 25s infinite ease-in-out',
          animationDelay: '-10s'
        }} />
        <div className="absolute rounded-full opacity-25 top-1/2 left-20 w-28 h-28 bg-gradient-to-r from-green-400 to-teal-500 blur-sm animate-pulse" style={{
          animation: 'float 18s infinite ease-in-out reverse',
          animationDelay: '-8s'
        }} />
      </div>

      {/* Split-screen layout - hero on left, login on right */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-20 animate-in fade-in duration-800">
        <div className="grid items-center w-full gap-8 max-w-7xl lg:grid-cols-2 lg:gap-16">
          {/* Left: SkillSwap tagline / hero */}
          <div className="space-y-6 text-white delay-200 lg:space-y-8 lg:text-left animate-in slide-in-from-left duration-800">
            <div className="inline-flex items-center gap-3 px-4 py-2 text-sm rounded-full bg-white/10 backdrop-blur-sm">
              <span className="block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">SkillSwap — trade skills, build momentum</span>
            </div>

            <h1 className="text-4xl font-bold leading-tight delay-300 md:text-5xl lg:text-6xl animate-in slide-in-from-bottom duration-800">
              SkillSwap
              <span className="block text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">swap skills. level up.</span>
            </h1>

            <p className="max-w-lg text-lg text-white/80 animate-in slide-in-from-bottom duration-600 delay-350">
              Connect with people who'll trade their expertise for yours. Quick swaps, real growth, zero noise.
            </p>

            <div className="pt-6">
              <p className="text-sm text-white/70">Trusted by learners and builders worldwide.</p>
            </div>
          </div>

          {/* Right: Glass-morphic login form */}
          <div className="flex justify-center delay-300 animate-in slide-in-from-right duration-800">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md p-8 transition-transform duration-300 border shadow-2xl lg:p-10 bg-white/10 backdrop-blur-xl rounded-2xl border-white/20 hover:-translate-y-1"
            >
              <h2 className="mb-8 text-3xl font-bold text-center text-white animate-in slide-in-from-top duration-600 delay-400">
                Login
              </h2>

              {/* Global error */}
              {error && (
                <div className="p-4 mb-6 text-center text-red-100 duration-500 border rounded-lg bg-red-500/20 border-red-400/30 backdrop-blur-sm animate-in slide-in-from-top">
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {loading && (
                <div className="mb-6 text-center duration-300 animate-in fade-in">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="font-medium text-blue-200">Logging in...</span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Email/Username */}
                <div className="duration-500 animate-in slide-in-from-left delay-450">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-white/90">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder="Enter your email or username"
                    className={`w-full p-4 text-white transition-all duration-300 border rounded-lg outline-none bg-white/10 backdrop-blur-sm focus:ring-2 focus:border-transparent focus:bg-white/15 disabled:opacity-50 placeholder-white/60 hover:bg-white/15 ${
                      emailError ? 'border-red-400/50 focus:ring-red-400' : 'border-white/20 focus:ring-indigo-400'
                    }`}
                    disabled={loading}
                    required
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-300 duration-300 animate-in slide-in-from-top">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="duration-500 animate-in slide-in-from-left delay-550">
                  <label htmlFor="password" className="block mb-2 text-sm font-medium text-white/90">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      placeholder="Enter your password"
                      className={`w-full p-4 text-white transition-all duration-300 border rounded-lg outline-none pr-11 bg-white/10 backdrop-blur-sm focus:ring-2 focus:border-transparent focus:bg-white/15 disabled:opacity-50 placeholder-white/60 hover:bg-white/15 ${
                        passwordError ? 'border-red-400/50 focus:ring-red-400' : 'border-white/20 focus:ring-indigo-400'
                      }`}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(prev => !prev)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      className="absolute transition-colors duration-200 -translate-y-1/2 text-white/80 hover:text-white right-3 top-1/2"
                      disabled={loading}
                    >
                      {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-300 duration-300 animate-in slide-in-from-top">
                      {passwordError}
                    </p>
                  )}

                  {/* Forgot Password link */}
                  <div className="flex justify-end mt-2">
                    <NavLink to="/forgot-password" className="text-sm text-indigo-200 transition-colors duration-200 hover:text-white">
                      Forgot Password?
                    </NavLink>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !!emailError || !!passwordError}
                  className="w-full p-4 font-semibold text-white transition-all duration-300 transform bg-indigo-600 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 animate-in slide-in-from-bottom duration-500 delay-650"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Logging in...' : 'Login'}
                  </span>
                </button>
              </div>

              <p className="mt-6 text-center duration-500 text-white/70 animate-in fade-in delay-750">
                Don't have an account?{' '}
                <NavLink to="/register" className="font-semibold text-indigo-300 transition-colors duration-200 hover:text-indigo-200 hover:underline">
                  Register
                </NavLink>
              </p>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-20px) translateX(10px) rotate(90deg); }
          50% { transform: translateY(20px) translateX(-5px) rotate(180deg); }
          75% { transform: translateY(-10px) translateX(15px) rotate(270deg); }
        }
      `}</style>
    </div>
  );
}

export default Login;