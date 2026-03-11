import React, { useEffect, useState } from 'react';
import { API } from '../config';
import { formatCurrency, formatNumber } from '../utils/format';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [highlightSaleId, setHighlightSaleId] = useState(null);
  const [range, setRange] = useState({ start:'', end:'' });
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [sortBy, setSortBy] = useState({ key: 'createdAt', dir: 'desc' });

  useEffect(() => {
    fetchAll();
    fetchDashboard();
    const handler = (e) => {
      const sid = e?.detail?.saleId || null;
      if (sid) setHighlightSaleId(sid);
      fetchAll();
      fetchDashboard();
      if (sid) setTimeout(() => setHighlightSaleId(null), 5000);
    };
    window.addEventListener('sale:created', handler);
    return () => window.removeEventListener('sale:created', handler);
  }, []);

  async function fetchAll(params) {
    setLoading(true);
    try {
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
      const res = await fetch(`${API}/sales${qs}`, { headers });
      if (!res.ok) {
        if (res.status === 401) setError('Not authorized — please log in as admin');
        else setError('Failed to load sales');
        setSales([]);
      } else {
        const data = await res.json();
        setSales(data);
        setError('');
      }
    } catch (e) {
      console.error("Error loading sales:", e);
      setError('Error loading sales');
    }
    setLoading(false);
  }

  async function fetchDashboard() {
    try {
      const res = await fetch(`${API}/reports/dashboard`);
      if (!res.ok) return;
      const data = await res.json();
      setRecentTx(data.recentTransactions || []);
    } catch (e) {
      // ignore
    }
  }

  async function view(id) {
    try {
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/sales/${id}`, { headers });
      setDetail(await res.json());
    } catch (e) {
      console.error("Error loading sale details:", e);
    }
  }

  async function doFilter() {
    const params = {};
    if (range.start) params.start = new Date(range.start).toISOString();
    if (range.end) params.end = new Date(range.end).toISOString();
    await fetchAll(params);
  }

  function exportCSV() {
    if (!sales || sales.length === 0) return alert('No sales to export');
    const src = sortList(useFilteredSales(sales, search, range));
    if (!src || src.length === 0) return alert('No sales to export');
    const rows = src.map(s => ({
      id: s.id,
      date: new Date(s.createdAt || s.created_at).toLocaleString(),
      items: (s.items && s.items.length) || s.items_count || 0,
      total: formatNumber(s.total || s.total_amount || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      cashier: (s.user && s.user.name) || s.cashier || s.created_by || ''
    }));
    const header = Object.keys(rows[0]).join(',');
    const csv = [header].concat(rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function voidSale(id) {
    if (!confirm('Void this sale?')) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/sales/${id}/void`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Void failed');
      alert('Sale voided');
      fetchAll();
      setDetail(null);
    } catch (e) { alert('Error: '+e.message); }
  }

  const filteredSales = useFilteredSales(sales, search, range);

  function sortList(list) {
    const arr = (list || []).slice();
    const key = sortBy?.key || 'createdAt';
    const dir = sortBy?.dir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      if (key === 'id') return (Number(a.id) - Number(b.id)) * dir;
      if (key === 'total') return (Number(a.total || a.total_amount || 0) - Number(b.total || b.total_amount || 0)) * dir;
      if (key === 'cashier') {
        const aa = ((a.user && a.user.name) || a.cashier || a.created_by || '').toLowerCase();
        const bb = ((b.user && b.user.name) || b.cashier || b.created_by || '').toLowerCase();
        return aa < bb ? -1 * dir : aa > bb ? 1 * dir : 0;
      }
      // default: createdAt
      const da = new Date(a.createdAt || a.created_at).getTime() || 0;
      const db = new Date(b.createdAt || b.created_at).getTime() || 0;
      return (da - db) * dir;
    });
    return arr;
  }

  const sortedSales = sortList(filteredSales);
  React.useEffect(() => {
    const max = Math.max(0, Math.floor((sortedSales.length - 1) / pageSize));
    if (pageIndex > max) setPageIndex(max);
  }, [sortedSales.length, pageSize]);
  const paginatedSales = sortedSales.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  function toggleSort(key) {
    if (sortBy.key === key) setSortBy({ key, dir: sortBy.dir === 'asc' ? 'desc' : 'asc' });
    else setSortBy({ key, dir: 'asc' });
  }

  return (
    <div className="page sales-page">
      <h2>Sales History</h2>

      <div className="sales-controls">
        <div className="sales-controls-group">
          <label>Start:</label>
          <input type="date" value={range.start} onChange={e=>setRange({...range, start:e.target.value})} />
          <label>End:</label>
          <input type="date" value={range.end} onChange={e=>setRange({...range, end:e.target.value})} />
          <button onClick={doFilter}>Filter</button>
          <button onClick={() => { setRange({ start:'', end:'' }); fetchAll(); }}>Clear</button>
        </div>

        <div className="sales-controls-group">
          <input className="sales-search" placeholder="Search by id, cashier, or amount" value={search} onChange={e=>{ setSearch(e.target.value); setPageIndex(0); }} />
          <button onClick={exportCSV}>Export CSV</button>
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPageIndex(0); }}>
            <option value={6}>6 / page</option>
            <option value={12}>12 / page</option>
            <option value={24}>24 / page</option>
          </select>
        </div>
      </div>

      <div className="sales-grid">
        <div className="sales-recent">
          <h4>Recent Transactions</h4>
          {recentTx.length === 0 && <div className="sales-empty">No recent transactions</div>}
          <RecentList items={recentTx} onView={view} />
        </div>

        <div className="sales-list">
          {loading && <div className="sales-empty">Loading...</div>}
          {!loading && sales.length === 0 && <div className="sales-empty">No sales yet</div>}
          {!loading && sales.length > 0 && (
            <div>
              <table className="sales-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => toggleSort('id')}>ID <span className="sort-indicator">{sortBy.key==='id' ? (sortBy.dir==='asc' ? '↑' : '↓') : ''}</span></th>
                    <th className="sortable" onClick={() => toggleSort('createdAt')}>Date <span className="sort-indicator">{sortBy.key==='createdAt' ? (sortBy.dir==='asc' ? '↑' : '↓') : ''}</span></th>
                    <th>Items</th>
                    <th className="sortable" onClick={() => toggleSort('cashier')}>Cashier <span className="sort-indicator">{sortBy.key==='cashier' ? (sortBy.dir==='asc' ? '↑' : '↓') : ''}</span></th>
                    <th className="sortable" onClick={() => toggleSort('total')}>Total <span className="sort-indicator">{sortBy.key==='total' ? (sortBy.dir==='asc' ? '↑' : '↓') : ''}</span></th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.map(s => (
                    <tr key={s.id} className={s.id === highlightSaleId ? 'highlight' : ''} onClick={() => view(s.id)}>
                      <td>#{s.id}</td>
                      <td className="muted">{new Date(s.createdAt || s.created_at).toLocaleString()}</td>
                      <td>{formatNumber((s.items && s.items.length) || s.items_count || 0)}</td>
                      <td>{(s.user && s.user.name) || s.cashier || s.created_by || ''}</td>
                      <td>{formatCurrency(s.total || s.total_amount || 0)}</td>
                      <td><button onClick={(e)=>{ e.stopPropagation(); view(s.id); }}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="sales-pagination">
                <div className="sales-pagination-meta">Showing {formatNumber(Math.min(1 + pageIndex*pageSize, filteredSales.length))} - {formatNumber(Math.min((pageIndex+1)*pageSize, filteredSales.length))} of {formatNumber(filteredSales.length)}</div>
                <div className="sales-pagination-actions">
                  <button onClick={() => setPageIndex(p => Math.max(0, p-1))} disabled={pageIndex===0}>Prev</button>
                  <button onClick={() => setPageIndex(p => Math.min(Math.floor((filteredSales.length-1)/pageSize), p+1))} disabled={(pageIndex+1)*pageSize >= filteredSales.length}>Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="sale-detail">
          {detail ? (
            <div>
              <h3>Sale #{detail.id}</h3>
              <div>
                <div><strong>Total:</strong> {formatCurrency(detail.total || detail.total_amount || 0)}</div>
                <div>
                  <strong>Items:</strong>
                  <ul className="detail-items">
                    {detail.items?.map((it, idx) => (
                      <li key={idx}>
                        {it.product_id && `Product #${it.product_id}`} x {formatNumber(it.quantity)} @ {formatCurrency(it.price)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="sale-detail-actions">
                  <button onClick={() => view(detail.id)}>Refresh</button>
                  <button onClick={() => voidSale(detail.id)}>Void</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="sales-empty">Select a sale to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecentList({ items = [], onView }) {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? items : items.slice(0,6);
  return (
    <div>
      {list.length === 0 && <div className="sales-empty">No recent transactions</div>}
      {list.map(t => (
        <div key={t.id} className="sale-row" onClick={() => onView(t.id)}>
          <div><strong>#{t.id}</strong></div>
          <div className="muted">{formatCurrency(t.total || 0)}</div>
          <div className="muted">{new Date(t.createdAt).toLocaleString()}</div>
        </div>
      ))}
      {items.length > 6 && (
        <div>
          <button type="button" className="btn-ghost" onClick={() => setShowAll(s => !s)}>{showAll ? 'Show Less' : `Show All (${formatNumber(items.length)})`}</button>
        </div>
      )}
    </div>
  );
}

// Derived data after search/filter
function useFilteredSales(sales, search, range) {
  const s = (sales || []).filter(item => {
    if (search) {
      const q = search.toLowerCase();
      const hay = `${item.id} ${(item.user && item.user.name) || ''} ${item.cashier || ''} ${item.total || item.total_amount || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (range.start) {
      const d = new Date(item.createdAt || item.created_at);
      if (isNaN(d)) return false;
      if (new Date(range.start) > d) return false;
    }
    if (range.end) {
      const d = new Date(item.createdAt || item.created_at);
      if (isNaN(d)) return false;
      if (new Date(range.end) < d) return false;
    }
    return true;
  });
  return s;
}
