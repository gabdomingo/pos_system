import React, { useEffect, useState } from 'react';
import { API } from '../config';
import { formatCurrency, formatNumber } from '../utils/format';

export default function Dashboard({ auth, onLogout }) {
  const [stats, setStats] = useState({ totalProducts: 0, lowStock: 0, totalSalesToday: 0, revenueToday: 0 });
  const [revenueLast7, setRevenueLast7] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', price: 0, stock: 0, barcode: '', image: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    const handler = () => fetchStats();
    window.addEventListener('sale:created', handler);
    return () => { window.removeEventListener('sale:created', handler); clearInterval(interval); };
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch(`${API}/reports/dashboard`);
      const data = await res.json();
      setStats({ totalProducts: data.totalProducts || 0, lowStock: data.lowStock || 0, totalSalesToday: data.totalSalesToday || 0, revenueToday: data.revenueToday || 0 });
      setRevenueLast7(data.revenueLast7 || []);
      setRecentTx(data.recentTransactions || []);
      setTopProducts(data.topProducts || []);
      setError("");
    } catch (e) {
      setError("Failed to load dashboard data");
    }
  }

  async function seedData() {
    setSeeding(true);
    try {
      await fetch(`${API}/products/seed`);
      await fetchStats();
      setError("");
    } catch (e) {
      setError("Failed to seed data");
    }
    setSeeding(false);
  }

  async function addProduct(e) {
    e?.preventDefault?.();
    if (!form.name) return;
    setAdding(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = (auth && auth.token) || localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/products`, { method: 'POST', headers, body: JSON.stringify(form) });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Add failed');
      }
      setForm({ name: '', category: '', price: 0, stock: 0, barcode: '', image: '' });
      setShowAdd(false);
      await fetchStats();
      try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Product added' } })); } catch (e) {}
    } catch (e) {
      setError('Add product failed');
    }
    setAdding(false);
  }

  return (
    <div className="page admin-page">
      <div className="pos-terminal-header admin-hero">
        <div>
          <div className="pos-kicker">Admin Workspace</div>
          <h2>Charlie PC Operations Dashboard</h2>
          <p>Welcome, {auth?.user?.name || auth?.user?.email || 'Admin'}. Monitor revenue, stock movement, and recent transactions from one control room.</p>
        </div>
        <div className="pos-header-actions">
          {/* {auth && auth.user && auth.user.role === 'admin' && (
            <button type="button" className="secondary" onClick={() => setShowAdd(true)}>Add Product</button>
          )} */}
          {onLogout ? <button type="button" className="btn-ghost" onClick={onLogout}>Logout</button> : null}
        </div>
      </div>
      {error && <div className="dashboard-error">{error}</div>}
      <div className="cards admin-stat-grid">
        <div className="card admin-stat-card">Total Products<br /><strong>{formatNumber(stats.totalProducts)}</strong></div>
        <div className="card admin-stat-card">Low Stock Items<br /><strong>{formatNumber(stats.lowStock)}</strong></div>
        <div className="card admin-stat-card">Sales Today<br /><strong>{formatNumber(stats.totalSalesToday)}</strong></div>
        <div className="card admin-stat-card">Revenue Today<br /><strong>{formatCurrency(stats.revenueToday)}</strong></div>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h4>Revenue (last 7 days)</h4>
          <div className="dashboard-chart">
            {revenueLast7.map(r=> (
              <div
                key={r.day}
                className="dashboard-bar"
                title={`${r.day} - ${formatCurrency(r.revenue)}`}
                style={{ height: `${Math.min(116, Math.max(12, Number(r.revenue || 0)))}px` }}
              >
                <span>{formatNumber(r.revenue, { maximumFractionDigits: 0 })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <h4>Top Products</h4>
          {topProducts.length===0 && <div className="dashboard-empty">No data</div>}
          {topProducts.map(p=> (
            <div key={p.id} className="dashboard-list-row">
              <div>{p.name}</div>
              <div className="dashboard-list-muted">{formatNumber(p.qty_sold || p.qty_sold === 0 ? p.qty_sold : 0)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h4>Recent Transactions</h4>
          {recentTx.length===0 && <div className="dashboard-empty">No recent transactions</div>}
          {recentTx.map(t=> (
            <div key={t.id} className="dashboard-list-row">
              <div>#{t.id}</div>
              <div>{formatCurrency(t.total || 0)}</div>
              <div className="dashboard-list-muted">{new Date(t.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
      {stats.totalProducts === 0 && (
        <div className="dashboard-empty-banner">
          <p>No products found. Import demo data to get started.</p>
          <button type="button" onClick={seedData} disabled={seeding}>
            {seeding ? "Loading..." : "Import Demo Data"}
          </button>
        </div>
      )}
      {showAdd && (
        <div className="modal" onClick={() => setShowAdd(false)}>
          <div className="modal-card" onClick={e=>e.stopPropagation()}>
            <h3>Add Product</h3>
            <form onSubmit={addProduct} className="modal-form-grid">
              <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required />
              <input placeholder="Category" value={form.category} onChange={e=>setForm({...form, category: e.target.value})} />
              <input type="number" placeholder="Price" value={form.price} onChange={e=>setForm({...form, price: Number(e.target.value)})} />
              <input type="number" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form, stock: Number(e.target.value)})} />
              <input placeholder="Image URL" value={form.image} onChange={e=>setForm({...form, image: e.target.value})} />
              <div className="modal-actions">
                <button type="submit" className="primary" disabled={adding}>{adding ? 'Adding...' : 'Add Product'}</button>
                <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
