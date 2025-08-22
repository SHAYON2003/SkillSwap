import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef, useState } from 'react';

// ---------- Decorative background pieces ----------
function FloatingDots({ count = 22 }) {
  const [dots] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 2,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 4,
    }))
  );
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-white/25"
          style={{ left: d.left, top: d.top, width: d.size, height: d.size, filter: 'blur(0.4px)' }}
          animate={{ y: [-8, 8, -8], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: d.duration, repeat: Infinity, delay: d.delay }}
        />
      ))}
    </div>
  );
}

function GradientBlobs() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none -z-20">
      <motion.div
        className="absolute w-56 h-56 rounded-full -top-24 -left-20 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.35), transparent)' }}
        animate={{ x: [-15, 8, -8], y: [0, 16, -12], rotate: [0, 18, -12] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute right-0 w-64 h-64 rounded-full top-1/2 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.35), transparent)' }}
        animate={{ x: [10, -10, 10], y: [-8, 8, -8], rotate: [0, -12, 10] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-0 rounded-full left-1/3 h-52 w-52 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(20,184,166,0.30), transparent)' }}
        animate={{ x: [0, 8, -8], y: [0, -10, 10] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute border rounded-lg top-10 left-1/3 size-10 border-white/25 bg-white/10 backdrop-blur"
        animate={{ rotate: [0, 15, -10, 0], y: [0, -5, 5, 0] }}
        transition={{ duration: 14, repeat: Infinity }}
      />
      <motion.div
        className="absolute border rounded-full bottom-8 right-1/4 size-12 border-white/25 bg-white/10 backdrop-blur"
        animate={{ scale: [1, 1.08, 1], x: [0, 6, -6, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      <div
        className="absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px, 28px 28px',
          backgroundPosition: '0 0, 0 0',
        }}
      />
    </div>
  );
}

// ---------- Navbar ----------
function Navbar({ socket }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll container (watch #app-scroll; fall back to window)
  const containerRef = useRef(null);

  useEffect(() => {
    const el = document.getElementById('app-scroll');
    containerRef.current = el || null;

    const handler = () => {
      const y = el ? el.scrollTop : window.scrollY;
      setScrolled(y > 10);
    };

    const target = el || window;
    target.addEventListener('scroll', handler, { passive: true });
    handler(); // run once
    return () => target.removeEventListener('scroll', handler);
  }, []);

  // Progress for the same container
  const opts = containerRef.current ? { container: containerRef } : undefined;
  const { scrollYProgress } = useScroll(opts);
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 20, mass: 0.3 });

  const handleLogout = () => {
    logout();
    if (socket) socket.disconnect();
    navigate('/login');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((s) => !s);

  const authenticatedNavItems = [
    { to: '/', label: 'Home' },
    { to: '/search', label: 'Search' },
    { to: '/requests', label: 'Requests' },
    { to: '/chats', label: 'Chats' },
    { to: '/notifications', label: 'Notifications', badge: user?.unreadCount },
    { to: '/profile', label: 'Profile' },
    { to: '/progress', label: 'Progress' },
  ];
  const unauthenticatedNavItems = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/contact', label: 'Contact' },
  ];
  const navItems = user ? authenticatedNavItems : unauthenticatedNavItems;

  return (
    <>
      {/* progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed left-0 right-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500"
      />

      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 ${
          scrolled
            ? 'bg-white/60 backdrop-blur-xl border-b border-white/30 shadow-lg'
            : 'bg-white/20 backdrop-blur-xl border-b border-white/20'
        }`}
      >
        <GradientBlobs />
        <FloatingDots />

        <div className="container flex items-center justify-between px-4 py-3 mx-auto lg:py-4">
          {/* Logo / Brand */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="cursor-pointer">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center shadow-md size-9 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-slate-900 via-indigo-700 to-sky-700 bg-clip-text">
                SkillSwap
              </h1>
            </NavLink>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="items-center hidden gap-2 lg:flex">
            {navItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="items-center hidden gap-3 lg:flex">
            {user ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <motion.div whileHover={{ scale: 1.04 }} className="flex items-center gap-2 px-3 py-2 border rounded-xl border-white/30 bg-white/30 backdrop-blur">
                  <span className="relative inline-flex">
                    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-emerald-500"></span>
                    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <div className="flex items-center justify-center rounded-full size-8 bg-gradient-to-r from-indigo-400 to-purple-500">
                      <span className="text-sm font-semibold text-white">
                        {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </span>
                  <span className="text-sm font-medium text-slate-800">{user.name || user.email?.split('@')[0]}</span>
                </motion.div>
                <motion.button
                  whileHover={{ y: -2, boxShadow: '0 10px 24px rgba(244,63,94,0.35)' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleLogout}
                  className="px-5 py-2 font-semibold text-white border shadow-lg rounded-xl border-rose-400/30 bg-gradient-to-r from-rose-500 to-rose-600"
                >
                  Logout
                </motion.button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-2">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <NavLink to="/login" className="px-5 py-2 text-sm font-medium border rounded-xl border-white/30 bg-white/30 text-slate-900 backdrop-blur hover:shadow">
                    Login
                  </NavLink>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <NavLink to="/register" className="px-5 py-2 text-sm font-semibold text-white shadow-lg rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600">
                    Sign Up
                  </NavLink>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen((s) => !s)}
            className="p-2 rounded-xl text-slate-900 lg:hidden hover:bg-white/30"
          >
            <motion.div animate={isMobileMenuOpen ? { rotate: 180 } : { rotate: 0 }} transition={{ duration: 0.3 }}>
              {isMobileMenuOpen ? (
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </motion.div>
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw] border-l border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl lg:hidden"
          >
            <GradientBlobs />
            <FloatingDots />
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-lg size-8 bg-gradient-to-r from-indigo-500 to-purple-600">
                    <span className="text-sm font-bold text-white">S</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">SkillShare</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-900 hover:bg-white/40"
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Nav Items */}
              <div className="flex-1 p-5 pt-2 space-y-3 overflow-y-auto">
                {navItems.map((item, index) => (
                  <motion.div key={item.to} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: index * 0.05 }}>
                    <NavLink
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-500/15 to-purple-600/15 text-slate-900 border border-indigo-300/40'
                            : 'text-slate-800 hover:bg-white/50'
                        }`
                      }
                    >
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span className="ml-2 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                          {Math.min(99, item.badge)}
                        </span>
                      ) : null}
                    </NavLink>
                  </motion.div>
                ))}
              </div>

              {/* Auth Zone */}
              <div className="p-5 border-t border-white/30">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border rounded-xl border-white/30 bg-white/40 backdrop-blur">
                      <div className="relative">
                        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-emerald-500" />
                        <div className="flex items-center justify-center rounded-full size-10 bg-gradient-to-r from-indigo-400 to-purple-500">
                          <span className="font-semibold text-white">
                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name || user.email?.split('@')[0]}</p>
                        <p className="text-sm text-slate-600">{user.email}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 font-semibold text-white shadow-lg rounded-xl bg-gradient-to-r from-rose-500 to-rose-600"
                    >
                      Logout
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                      <NavLink
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 font-medium text-center border rounded-xl border-white/30 bg-white/40 text-slate-900 backdrop-blur"
                      >
                        Login
                      </NavLink>
                    </motion.div>
                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                      <NavLink
                        to="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 font-semibold text-center text-white shadow-lg rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600"
                      >
                        Sign Up
                      </NavLink>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`.navlink { position: relative; }`}</style>
    </>
  );
}

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `group navlink relative rounded-xl px-3 py-2 text-sm font-medium transition-all ${
          isActive ? 'text-slate-900' : 'text-slate-800 hover:text-slate-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative z-10 flex items-center gap-2">
            {item.label}
            {item.badge ? (
              <span className="ml-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                {Math.min(99, item.badge)}
              </span>
            ) : null}
          </span>
          <motion.div className="absolute inset-0 transition-opacity opacity-0 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-600/10 backdrop-blur-sm group-hover:opacity-100" />
          <AnimatePresence>
            {isActive && (
              <motion.div
                layoutId="active-underline"
                className="absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  );
}

export default Navbar;
