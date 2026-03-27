import React, { useEffect, useState, useRef } from 'react';
import { API } from '../config';
import { PRODUCT_CATEGORIES } from '../constants/productCategories';
import { formatCurrency, formatNumber } from '../utils/format';
import './products-admin.css';

const PRODUCT_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'>
    <rect width='96' height='96' rx='12' fill='#eef2ff'/>
    <rect x='20' y='24' width='56' height='40' rx='8' fill='none' stroke='#64748b' stroke-width='4'/>
    <circle cx='34' cy='38' r='6' fill='#64748b'/>
    <path d='M24 60l12-12 8 8 8-10 20 18' fill='none' stroke='#64748b' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/>
  </svg>`
)}`;

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  stock: '',
  barcode: '',
  image: '',
  imagePreview: '',
  resetImage: false
};

export default function ProductsPage({ auth, onLogout }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setMessage('Error loading products');
    }
  }

  function validate() {
    if (!form.name.trim()) return 'Name is required';
    if (!form.category.trim()) return 'Category is required';
    if (form.price === '' || Number(form.price) < 0) return 'Price must be a positive number';
    if (form.stock === '' || Number(form.stock) < 0) return 'Stock must be a non-negative integer';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (v) return setMessage(v);
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        barcode: form.barcode.trim() || null,
      };
      if (form.image) payload.image = form.image;
      if (editing && form.resetImage) payload.resetImage = true;

      const token = (auth && auth.token) || localStorage.getItem('token');
      if (!token) throw new Error('Please log in as admin or cashier');
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      if (editing) {
        const res = await fetch(`${API}/products/${editing}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || data.message || res.statusText || 'Update failed');
        setMessage(data.error || data.message || 'Product updated successfully');
        setEditing(null);
      } else {
        const res = await fetch(`${API}/products`, { method: 'POST', headers, body: JSON.stringify(payload) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || data.message || res.statusText || 'Add failed');
        setMessage(data.error || data.message || 'Product added successfully');
      }

      setForm(EMPTY_FORM);
      if (fileRef.current) fileRef.current.value = '';
      fetchProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p) {
    setEditing(p.id);
    setForm({
      name: p.name || '',
      category: p.category || '',
      price: String(p.price || ''),
      stock: String(p.stock || ''),
      barcode: p.barcode || '',
      image: '',
      imagePreview: p.image || '',
      resetImage: false
    });
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return;
    try {
      const token = (auth && auth.token) || localStorage.getItem('token');
      if (!token) throw new Error('Please log in as admin');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/products/${id}`, { method: 'DELETE', headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Delete failed');
      setMessage('Product deleted');
      fetchProducts();
      setTimeout(() => setMessage(''), 2000);
    } catch (e) {
      setMessage(e.message || 'Error deleting product');
    }
  }

  function handleFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, image: reader.result, imagePreview: reader.result, resetImage: false }));
    reader.readAsDataURL(f);
  }

  function resetImage() {
    setForm((prev) => ({ ...prev, image: '', imagePreview: '', resetImage: Boolean(editing) }));
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="prod-container">
      <div className="pos-terminal-header admin-hero admin-hero-compact">
        <div>
          <div className="pos-kicker">Inventory Control</div>
          <h2>Manage Charlie PC Products</h2>
          <p>Keep catalog details clean, stock counts accurate, and product images ready for both cashier and customer views.</p>
        </div>
        <div className="pos-header-actions">
          <div className="pos-shift-chip admin-hero-chip">
            <span>Active products</span>
            <strong>{formatNumber(products.length)}</strong>
          </div>
          {onLogout ? <button type="button" className="btn-ghost" onClick={onLogout}>Logout</button> : null}
        </div>
      </div>

      {message && (
        <div className={"message " + (message.toLowerCase().includes('success') ? 'success' : 'error')}>{message}</div>
      )}

      <div className="grid">
        <div>
          <div className="card">
            <form className="form" onSubmit={handleSubmit}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>Product details</div>
                {/* <div className="advanced-toggle">
                  <label className="small-text">Advanced</label>
                  <input type="checkbox" checked={advanced} onChange={e => setAdvanced(e.target.checked)} />
                </div> */}
              </div>

              <input className="input" placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <div>
                <label className="small-text" htmlFor="product-category">Category</label>
                <select id="product-category" className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select category</option>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="small-text">Product photo</label>
                <input ref={fileRef} className="file-input-hidden" type="file" accept="image/*" onChange={handleFile} />
                <div className="image-picker-actions">
                  <button className="btn ghost" type="button" onClick={() => fileRef.current?.click()}>Choose Photo</button>
                  {(form.imagePreview || (editing && !form.resetImage)) ? (
                    <button className="btn" type="button" onClick={resetImage}>Use Category Photo</button>
                  ) : null}
                </div>
                <div className="small-text">Leave it blank and the category photo will be used.</div>
                {form.imagePreview ? (
                  <img className="file-preview" src={form.imagePreview} alt="preview" />
                ) : (
                  <div className="image-placeholder">No custom photo selected</div>
                )}
              </div>

              <div className="row">
                <input className="input" placeholder="Price" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                <input className="input small" placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
              </div>

              {advanced && (
                <>
                  <input className="input" placeholder="Barcode (optional)" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
                </>
              )}

              <div className="btn-row">
                <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Saving...' : (editing ? 'Update Product' : 'Add Product')}</button>
                <button className="btn ghost" type="button" onClick={() => { setForm(EMPTY_FORM); setEditing(null); if (fileRef.current) fileRef.current.value = ''; }}>Clear</button>
                {editing && <button className="btn" type="button" onClick={() => { setEditing(null); setForm(EMPTY_FORM); if (fileRef.current) fileRef.current.value = ''; }}>Cancel Edit</button>}
              </div>
            </form>
          </div>

          <h3 style={{ marginTop: 18, marginBottom: 8, color: '#2b3646' }}>Existing products</h3>
          <div className="products-list">
            {products.length === 0 && <div className="muted">No products yet — add one using the form.</div>}
            {products.map(p => (
              <div key={p.id} className="prod-card">
                <div className="avatar">
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER; }} /> : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </div>
                <div className="prod-meta">
                  <div className="prod-name">{p.name}</div>
                  <div className="prod-sub">{p.category || 'Uncategorized'} • {formatCurrency(p.price)}</div>
                </div>
                <div className="prod-stock" style={{ color: p.stock <= 3 ? '#b45309' : '#111827' }}>{formatNumber(p.stock)}</div>
                <div className="controls">
                  <button className="edit-btn" onClick={() => startEdit(p)}>Edit</button>
                  {advanced && <button className="btn danger" onClick={() => handleDelete(p.id)}>Delete</button>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="aside">
          <div className="tips card">
            <h4 style={{ margin: 0, marginBottom: 8 }}>Tips</h4>
            <ul style={{ marginTop: 8, color: '#374151', lineHeight: 1.6 }}>
              <li>Give clear product names and categories.</li>
              <li>Upload images for better product recognition.</li>
              <li>Keep stock accurate to avoid overselling.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
