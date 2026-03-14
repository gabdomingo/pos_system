import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function titleFromPath(path) {
  if (!path) return 'Dashboard';
  if (path.startsWith('/admin')) {
    const parts = path.replace('/admin', '').split('/').filter(Boolean);
    const key = parts[0] || 'dashboard';
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
  return 'App';
}

export default function Topbar({ auth, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = titleFromPath(location.pathname);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h3 className="page-title">{title}</h3>
      </div>
      <div className="topbar-right">
        {auth && auth.user ? (
          <div className="user-area">
            <div className="muted user-name">Welcome, {auth.user.name || auth.user.email}</div>
            <button className="nav-btn" onClick={() => { onLogout(); navigate('/login'); }}>Logout</button>
          </div>
        ) : (
          <div>
            <button className="nav-btn" onClick={() => navigate('/login')}>Login</button>
          </div>
        )}
      </div>
    </header>
  );
}
