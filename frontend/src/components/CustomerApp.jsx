import React, { useEffect, useState } from 'react';
import { API } from '../config';
import { formatCurrency, formatNumber } from '../utils/format';
import Toast from './Toast';
import '../styles/customer.css';

const HERO_BANNER_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 360'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#1d4ed8'/>
        <stop offset='1' stop-color='#0f172a'/>
      </linearGradient>
    </defs>
    <rect width='1200' height='360' fill='url(#g)'/>
    <circle cx='980' cy='-40' r='220' fill='rgba(255,255,255,0.12)'/>
    <circle cx='120' cy='380' r='210' fill='rgba(255,255,255,0.10)'/>
    <text x='60' y='205' fill='white' font-family='Arial, sans-serif' font-size='52' font-weight='700'>POS Storefront</text>
    <text x='60' y='248' fill='rgba(255,255,255,0.9)' font-family='Arial, sans-serif' font-size='24'>Featured tech deals and essentials</text>
  </svg>`
)}`;

const PRODUCT_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'>
    <defs>
      <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#eef2ff'/>
        <stop offset='1' stop-color='#dbeafe'/>
      </linearGradient>
    </defs>
    <rect width='320' height='180' fill='url(#bg)'/>
    <rect x='92' y='44' width='136' height='90' rx='10' fill='none' stroke='#64748b' stroke-width='6'/>
    <circle cx='132' cy='82' r='12' fill='#64748b'/>
    <path d='M104 124l30-28 18 16 24-26 40 38' fill='none' stroke='#64748b' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/>
    <text x='160' y='162' text-anchor='middle' fill='#334155' font-family='Arial, sans-serif' font-size='20' font-weight='700'>No Photo</text>
  </svg>`
)}`;

export default function CustomerApp({ setMode, auth, onLogout, onNavigate }) {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', category: '', price: '', stock: '' , image: ''});
  const [adding, setAdding] = useState(false);
  const canAddProduct = Boolean(auth && auth.user && (auth.user.role === 'admin' || auth.user.role === 'cashier'));

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => {
    if (!canAddProduct) setShowAddForm(false);
  }, [canAddProduct]);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error('Error fetching products', e);
    }
  }

  const filtered = products.filter(p => !q.trim() || p.name.toLowerCase().includes(q.toLowerCase()) || (p.category||'').toLowerCase().includes(q.toLowerCase()));

  function openDetail(p) { setSelected(p); }

  function addToCart(p, qty = 1) {
    if (p.stock === 0) { setMessage('Out of stock'); setTimeout(()=>setMessage(''),2000); return; }
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) {
        return prev.map(i => i.id === p.id ? { ...i, quantity: Math.min(p.stock, i.quantity + qty) } : i);
      }
      return [...prev, { ...p, quantity: qty }];
    });
    setMessage('Added to cart');
    setTimeout(()=>setMessage(''),2000);
  }

  function updateQty(id, q) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, Math.min(i.stock, q)) } : i));
  }

  function removeItem(id) { setCart(prev => prev.filter(i => i.id !== id)); }

  const subtotal = cart.reduce((s,i)=>s + i.price * i.quantity, 0);

  async function checkout() {
    if (cart.length === 0) { setMessage('Cart empty'); setTimeout(()=>setMessage(''),2000); return; }
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/sales`, {
        method: 'POST', headers,
        body: JSON.stringify({ items: cart.map(i=>({ id: i.id, quantity: i.quantity, price: i.price })), total: subtotal, paymentMethod: 'Online' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      setCart([]);
      setShowCart(false);
      try { window.dispatchEvent(new CustomEvent('sale:created', { detail: { saleId: data.id || data._id || null } })); window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Thank you — order placed' } })); } catch (e) {}
    } catch (e) {
      setMessage('Checkout error: ' + (e.message||''));
      setTimeout(()=>setMessage(''),3000);
    }
  }

  return (
    <div className="customer-root">
      <header className="customer-header">
        <div className="customer-left">
          <div className="customer-logo" onClick={() => { setMode('customer'); if (onNavigate) onNavigate('/'); else window.history.pushState({}, '', '/'); }}>POS</div>
          <nav className="customer-nav">
            <button className="nav-link" onClick={() => setQ('')}>All</button>
            <button className="nav-link" onClick={() => setQ('Processor')}>Processors</button>
            <button className="nav-link" onClick={() => setQ('Graphics Card')}>Graphics</button>
            <button className="nav-link" onClick={() => setQ('SSD')}>SSDs</button>
          </nav>
        </div>

        <div className="customer-actions">
          <div className="search-wrap">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products or categories" className="search-input" />
          </div>
          <button className="cart-btn" onClick={() => setShowCart(s => !s)} aria-label="Toggle cart">Cart <span className="cart-badge">{formatNumber(cart.length)}</span></button>
          {auth && auth.user ? (
            <button onClick={onLogout} className="btn-ghost">Logout</button>
          ) : (
            <button onClick={() => { if (onNavigate) onNavigate('/login'); else window.location.href = '/login'; }} className="primary">Login</button>
          )}
        </div>
      </header>

      <section className="hero" aria-hidden>
        <div className="hero-banner">
          <img
            src={HERO_BANNER_PLACEHOLDER}
            alt="hero"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = HERO_BANNER_PLACEHOLDER;
            }}
          />
          <div className="hero-overlay">
            <h3>Featured Deals</h3>
            <p>Browse curated picks and great offers.</p>
          </div>
        </div>
      </section>

      <main className="customer-main">
        <aside className="category-panel">
          <h4>Categories</h4>
          <div className="category-list">
            {['Processor','Motherboard','Graphics Card','Memory','SSD','Power Supply','PC Case','Laptops'].map((c,i)=>(
              <button key={i} className="category-item" onClick={() => setQ(c)}>{c}</button>
            ))}
          </div>
        </aside>

        <section className="products-area">
          <div className="products-header">
            <h2>Products</h2>
            <div className="products-meta">{formatNumber(filtered.length)} items</div>
            {canAddProduct && (
              <div className="products-header-actions">
                <button className="primary" onClick={() => setShowAddForm(s => !s)}>{showAddForm ? 'Hide Add' : 'Add Product'}</button>
              </div>
            )}
          </div>

          {message && <Toast message={message} onClose={() => setMessage('')} />}

          {canAddProduct && showAddForm && (
            <div className="customer-add-wrap">
              <div className="customer-add-title">Add Product</div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                // basic validation
                if (!addForm.name.trim()) { setMessage('Name required'); setTimeout(()=>setMessage(''),2000); return; }
                if (addForm.price === '' || Number(addForm.price) < 0) { setMessage('Invalid price'); setTimeout(()=>setMessage(''),2000); return; }
                if (addForm.stock === '' || Number(addForm.stock) < 0) { setMessage('Invalid stock'); setTimeout(()=>setMessage(''),2000); return; }
                setAdding(true);
                try {
                  const token = (auth && auth.token) || localStorage.getItem('token');
                  if (!token) throw new Error('Please log in as admin or cashier');
                  const res = await fetch(`${API}/products`, {
                    method: 'POST',
                    headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name: addForm.name.trim(), category: addForm.category.trim() || 'Uncategorized', price: Number(addForm.price), stock: Number(addForm.stock), image: addForm.image || null })
                  });
                  const data = await res.json().catch(()=>({}));
                  if (!res.ok) throw new Error(data.error || data.message || res.statusText || 'Add failed');
                  setMessage(data.error || data.message || 'Product added');
                  setAddForm({ name:'', category:'', price:'', stock:'', image:'' });
                  fetchProducts();
                  setTimeout(()=>setMessage(''),3000);
                } catch (err) {
                  setMessage(err.message || 'Error submitting product');
                } finally { setAdding(false); }
              }} className="customer-add-form">
                <input className="span-2" placeholder="Name" value={addForm.name} onChange={e=>setAddForm({ ...addForm, name: e.target.value })} required />
                <input className="span-1" placeholder="Category" value={addForm.category} onChange={e=>setAddForm({ ...addForm, category: e.target.value })} />
                <input className="span-1" placeholder="Price" type="number" step="0.01" value={addForm.price} onChange={e=>setAddForm({ ...addForm, price: e.target.value })} />
                <input className="span-1" placeholder="Stock" type="number" value={addForm.stock} onChange={e=>setAddForm({ ...addForm, stock: e.target.value })} />
                <input className="span-2" placeholder="Image URL (optional)" value={addForm.image} onChange={e=>setAddForm({ ...addForm, image: e.target.value })} />
                <button type="submit" className="primary span-1" disabled={adding}>{adding? 'Adding...':'Submit'}</button>
              </form>
            </div>
          )}

          <div className="products-grid" aria-live="polite">
            {filtered.map(p => (
              <article key={p.id} className="product-card" onClick={() => openDetail(p)}>
                <div className="product-media">
                  <img
                    src={p.image || PRODUCT_IMAGE_PLACEHOLDER}
                    alt={p.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
                    }}
                  />
                </div>
                <div className="product-body">
                  <div className="product-title">{p.name}</div>
                  <div className="product-cat">{p.category}</div>
                  <div className="product-price">{formatCurrency(p.price)}</div>
                  <div className="product-actions">
                    <button className="secondary" onClick={(e)=>{ e.stopPropagation(); addToCart(p,1); }}>Add</button>
                    <button className="btn-link" onClick={(e)=>{ e.stopPropagation(); openDetail(p); }}>Details</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {selected && (
        <div className="modal" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={e=>e.stopPropagation()}>
            <div className="modal-media">
              <img
                src={selected.image || PRODUCT_IMAGE_PLACEHOLDER}
                alt={selected.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
                }}
              />
            </div>
            <div className="modal-body">
              <h3>{selected.name}</h3>
              <div className="muted">{selected.category}</div>
              <div className="big-price">{formatCurrency(selected.price)}</div>
              <p>{selected.description || 'No description available.'}</p>
              <div className="modal-actions">
                <button onClick={() => addToCart(selected, 1)} className="primary">Add to cart</button>
                <button onClick={() => setSelected(null)} className="btn-ghost">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="cart-drawer">
          <h4>Your Cart</h4>
          {cart.length === 0 && <div className="muted">Cart is empty</div>}
          {cart.map(i => (
            <div key={i.id} className="cart-item">
              <div className="ci-left">
                <div className="ci-title">{i.name}</div>
                <div className="ci-price">{formatCurrency(i.price)}</div>
              </div>
              <div className="ci-right">
                <input type="number" value={i.quantity} onChange={e=>updateQty(i.id, Number(e.target.value))} min={1} max={i.stock} />
                <button onClick={() => removeItem(i.id)} className="btn-ghost">Remove</button>
              </div>
            </div>
          ))}
          <div className="cart-footer">
            <div className="cart-total">Total: {formatCurrency(subtotal)}</div>
            <div className="cart-actions">
              <button onClick={checkout} className="primary">Checkout</button>
              <button onClick={() => setShowCart(false)} className="btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
