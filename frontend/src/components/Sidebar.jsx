import React, { useEffect, useState } from 'react';
import { API } from '../config';
import { formatCurrency, formatNumber } from '../utils/format';

export default function Sidebar({ page, setPage, mode, setMode, auth, onLogout, onNavigate }) {
  const [stats, setStats] = useState({ totalProducts: 0, revenueToday: 0, lowStock: 0 });
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    fetch(`${API}/reports/dashboard`).then(r => r.json()).then(setStats).catch(() => {});
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="logo">Charlie PC</h2>
        <div className="time-display">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      <div className="sidebar-stats">
        <div className="stat-item">
          <div className="stat-label">Revenue Today</div>
          <div className="stat-value">{formatCurrency(stats.revenueToday, 0)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Products</div>
          <div className="stat-value">{formatNumber(stats.totalProducts)}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Low Stock</div>
          <div className={`stat-value ${stats.lowStock > 0 ? 'text-danger' : 'text-success'}`}>{formatNumber(stats.lowStock)}</div>
        </div>
      </div>

      <div className="sidebar-divider"></div>

      <nav className="sidebar-nav">
        <button type="button" className={page === "dashboard" ? "nav-btn active" : "nav-btn"} onClick={() => setPage('dashboard')}>
          <span className="nav-icon">📊</span> Dashboard
        </button>
        {/* POS removed per request - keep admin-focused pages only */}
        <button type="button" className={page === "products" ? "nav-btn active" : "nav-btn"} onClick={() => { setPage('products'); try { window.dispatchEvent(new CustomEvent('products:openAdd')); } catch(e){} }}>
          <span className="nav-icon">📦</span> Add Product
        </button>
        <button type="button" className={page === "sales" ? "nav-btn active" : "nav-btn"} onClick={() => setPage('sales')}>
          <span className="nav-icon">📈</span> Sales History
        </button>
      </nav>
    </div>
  );
}
