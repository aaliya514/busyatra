import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage    from './pages/LandingPage';
import Auth           from './pages/Auth';
import Dashboard      from './pages/Dashboard';
import MapTracking    from './pages/MapTracking';
import FareCalculator from './pages/FareCalculator';
import Profile        from './pages/Profile';
import Notifications  from './pages/Notifications';
import DriverPage     from './pages/DriverPage';
import AdminPage      from './pages/AdminPage';
import socketService  from './services/socket';

// Simple hash-based routing so /map, /driver, /admin etc work in the URL
function getPageFromHash() {
  const hash = window.location.hash.replace('#', '') || '';
  const valid = ['dashboard','map','fare','notifications','profile','driver','admin'];
  return valid.includes(hash) ? hash : null;
}

function App() {
  const { isAuthenticated, loading, logout, user } = useAuth();

  const defaultPageForRole = (u) => {
    if (!u) return 'dashboard';
    if (u.role === 'driver') return 'driver';
    if (u.role === 'admin')  return 'admin';
    return 'dashboard';
  };

  const [currentPage, setCurrentPage] = useState(() => getPageFromHash() || 'landing');

  // auth modal: false | 'login' | 'register'
  // roleHint: 'user' | 'driver' | 'admin' — pre-fills login hint
  const [showAuth, setShowAuth]     = useState(false);
  const [roleHint, setRoleHint]     = useState('user');

  // On auth state change, redirect to the right page
  useEffect(() => {
    if (isAuthenticated && user) {
      const fromHash = getPageFromHash();
      // Respect URL hash if it's valid for this role, else use default
      const page = fromHash || defaultPageForRole(user);
      setCurrentPage(page);
      setShowAuth(false);
      socketService.connect();
    } else if (!isAuthenticated) {
      setCurrentPage('landing');
      socketService.disconnect();
    }
    return () => {};
  }, [isAuthenticated, user]);

  // Sync URL hash when page changes
  useEffect(() => {
    if (currentPage !== 'landing') {
      window.location.hash = currentPage;
    } else {
      window.location.hash = '';
    }
  }, [currentPage]);

  // Handle browser back/forward
  useEffect(() => {
    const onHash = () => {
      if (isAuthenticated) {
        const p = getPageFromHash();
        if (p) setCurrentPage(p);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [isAuthenticated]);

  // Unauthorized event
  useEffect(() => {
    const handle = () => logout();
    window.addEventListener('busyatra_unauthorized', handle);
    return () => window.removeEventListener('busyatra_unauthorized', handle);
  }, [logout]);

  const navigate = (page) => setCurrentPage(page);

  const openPassengerLogin = (mode = 'login') => {
    setRoleHint('user');
    setShowAuth(mode);
  };
  const openDriverLogin = () => {
    setRoleHint('driver');
    setShowAuth('login');
  };
  const openAdminLogin = () => {
    setRoleHint('admin');
    setShowAuth('login');
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <>
      {showAuth && (
        <Auth
          mode={showAuth}
          roleHint={roleHint}
          onClose={() => setShowAuth(false)}
        />
      )}

      {!isAuthenticated ? (
        <LandingPage
          onPassengerLogin={openPassengerLogin}
          onDriverLogin={openDriverLogin}
          onAdminLogin={openAdminLogin}
        />
      ) : (
        <>
          {currentPage === 'dashboard'     && <Dashboard      onNavigate={navigate} />}
          {currentPage === 'map'           && <MapTracking     onNavigate={navigate} />}
          {currentPage === 'fare'          && <FareCalculator  onNavigate={navigate} />}
          {currentPage === 'notifications' && <Notifications   onNavigate={navigate} />}
          {currentPage === 'profile'       && <Profile         onNavigate={navigate} />}
          {currentPage === 'driver'        && <DriverPage      onNavigate={navigate} />}
          {currentPage === 'admin'         && <AdminPage       onNavigate={navigate} />}
        </>
      )}
    </>
  );
}

export default App;
