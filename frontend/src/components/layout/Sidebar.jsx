import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ auth, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function handleResize() {
      setCollapsed(window.innerWidth < 600);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <aside className={"sidebar" + (collapsed ? ' collapsed' : '')} aria-label="Admin sidebar">
      <div className="sidebar-header">
        <h2 className="logo">POS</h2>
        <button className="nav-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">{collapsed ? '➡' : '⬅'}</button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>📊 Dashboard</NavLink>
        <NavLink to="/admin/products" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>📦 Products</NavLink>
        <NavLink to="/admin/sales" className={({ isActive }) => isActive ? 'nav-btn active' : 'nav-btn'}>📈 Sales</NavLink>
      </nav>

      <div className="sidebar-divider"></div>

      <div className="sidebar-footer">
        <div className="footer-item">Version 1.0</div>
        {auth && auth.user ? (
          <div className="footer-item footer-user">
            <div className="muted">{auth.user.name || auth.user.email}</div>
            <div className="spacer-small" />
            <button className="nav-btn" onClick={onLogout}>Logout</button>
          </div>
        ) : (
          <div className="footer-item">
            <a className="nav-btn" href="/login">Login</a>
          </div>
        )}
      </div>
    </aside>
  );
}
