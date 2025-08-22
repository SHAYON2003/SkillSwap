// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Chats from './pages/Chats';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Search from './pages/Search';
import Requests from './pages/Requests';
import Navbar from './components/Navbar';
import About from './pages/About';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Progress from './pages/Progress';


// Layouts
function MainLayout({ socket }) {
  return (
    <>
      <Navbar socket={socket} />
      <Outlet />
    </>
  );
}

function AuthLayout() {
  // no Navbar on auth pages
  return <Outlet />;
}

// Route guards
function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;            // or a loader
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  // ✅ Fixed: redirect to /home instead of /chats
  return user ? <Navigate to="/home" replace /> : children;
}

export default function App() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(process.env.REACT_APP_WS_URL, { autoConnect: false });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="relative min-h-screen text-white bg-gray-900">
          <Routes>
            {/* Auth-only layout (no Navbar) */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            </Route>

            {/* Main app layout (with Navbar) */}
            <Route element={<MainLayout socket={socket} />}>
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
              <Route path="/chats" element={<ProtectedRoute><Chats socket={socket} /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications socket={socket} /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path='/forgot-password' element= {<ForgotPassword/>} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path='/progress' element={<Progress/>} />
            
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}