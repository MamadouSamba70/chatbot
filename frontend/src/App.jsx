import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { BellRing, X } from 'lucide-react';

const BACKEND_URL = 'http://127.0.0.1:8000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [isStaff, setIsStaff] = useState(localStorage.getItem('is_staff') === 'true');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [seenNotificationIds, setSeenNotificationIds] = useState(new Set());
  const [firstLoadDone, setFirstLoadDone] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Initial verification of stored tokens
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, [token]);

  // Polling for notification toasts
  useEffect(() => {
    if (!token) return;

    const checkNewNotifications = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/notifications/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const notifs = res.data;
        
        if (!firstLoadDone) {
          // On first run, mark all current notifications as seen so we don't spam the UI with past history
          const initialSet = new Set(notifs.map(n => n.id));
          setSeenNotificationIds(initialSet);
          setFirstLoadDone(true);
          return;
        }
        
        // Find push notifications that we haven't seen in this session yet
        const newPushNotifs = notifs.filter(n => n.channel === 'push' && !seenNotificationIds.has(n.id));
        
        if (newPushNotifs.length > 0) {
          // Add to seen set
          const updatedSeen = new Set(seenNotificationIds);
          newPushNotifs.forEach(n => {
            updatedSeen.add(n.id);
            // Add toast popup
            addToast(n);
          });
          setSeenNotificationIds(updatedSeen);
        }
      } catch (err) {
        console.error("Error checking background notifications:", err);
      }
    };

    // Run check immediately and then every 7 seconds
    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 7000);
    return () => clearInterval(interval);
  }, [token, seenNotificationIds, firstLoadDone]);

  const addToast = (notification) => {
    const id = Date.now() + Math.random();
    setToasts(prev => {
      const updated = [...prev, { id, ...notification }];
      // Limit to maximum 2 concurrent toasts on screen to avoid blocking the UI
      if (updated.length > 2) {
        return updated.slice(updated.length - 2);
      }
      return updated;
    });
    
    // Auto remove toast after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLoginSuccess = (accessToken, refToken, loggedUsername, isStaffUser) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refToken);
    localStorage.setItem('username', loggedUsername);
    localStorage.setItem('is_staff', isStaffUser ? 'true' : 'false');
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    setToken(accessToken);
    setRefreshToken(refToken);
    setUsername(loggedUsername);
    setIsStaff(isStaffUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('is_staff');
    delete axios.defaults.headers.common['Authorization'];
    
    setToken(null);
    setRefreshToken(null);
    setUsername(null);
    setIsStaff(false);
    setSeenNotificationIds(new Set());
    setToasts([]);
    setFirstLoadDone(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement de ReminderBot...</p>
      </div>
    );
  }

  const authHeader = { Authorization: `Bearer ${token}` };

  return (
    <div className="app-container" style={{ display: token ? 'flex' : 'block' }}>
      {token ? (
        <Dashboard
          username={username}
          isStaff={isStaff}
          onLogout={handleLogout}
          backendUrl={BACKEND_URL}
          authHeader={authHeader}
        />
      ) : showAuth ? (
        <Auth 
          onLoginSuccess={handleLoginSuccess} 
          backendUrl={BACKEND_URL} 
          onBackToLanding={() => setShowAuth(false)}
        />
      ) : (
        <LandingPage onGetStarted={() => setShowAuth(true)} />
      )}

      {/* Floating Toast notification system */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.event_type || 'examen'}`}>
            <span className="toast-icon"><BellRing size={20} /></span>
            <div className="toast-content">
              <div className="toast-title">Alerte de Rappel !</div>
              <div className="toast-msg">{toast.message}</div>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
