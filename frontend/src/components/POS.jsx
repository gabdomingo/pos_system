import React, { useEffect, useState } from 'react';
import { API } from '../config';
import { formatCurrency, formatNumber } from '../utils/format';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [taxRate, setTaxRate] = useState(0.12);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('%');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashReceived, setCashReceived] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);
  
  async function fetchProducts() {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      setMessage("Error loading products");
    }
  }

  function addToCart(p) {
    if (p.stock === 0) {
      setMessage("Out of stock!");
      return;
    }
    const existing = cart.find(i => i.id === p.id);
    if (existing) {
      if (existing.quantity >= p.stock) {
        setMessage("Cannot exceed stock");
        return;
      }
      setCart(cart.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...p, quantity: 1 }]);
    }
    setMessage("");
  }

  function updateQuantity(id, q) {
    const pr = products.find(p => p.id === id);
    if (!pr || q <= 0 || q > pr.stock) return;
    setCart(cart.map(i => i.id === id ? { ...i, quantity: q } : i));
  }

  function removeItem(id) {
    setCart(cart.filter(i => i.id !== id));
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  let total = subtotal;
  if (discount) {
    total = discountType === '%' ? total * (1 - discount / 100) : Math.max(0, total - Number(discount));
  }
  const tax = total * taxRate;
  const final = total + tax;
  const change = cashReceived - final;

  async function checkout() {
    if (cart.length === 0) {
      setMessage("Cart is empty");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/sales`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
          total: final,
          paymentMethod
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✓ Sale completed successfully");
        setCart([]);
        fetchProducts();
        try {
          window.dispatchEvent(new CustomEvent('sale:created', { detail: data }));
          window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Checkout complete — sale recorded' } }));
        } catch (e) {}
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || 'Checkout failed');
      }
    } catch (e) {
      setMessage("Checkout error: " + e.message);
    }
    setLoading(false);
  }

  return (
    <div className="page pos">
      <div className="pos-left">
        <div className="pos-controls">
          <label>Tax %<input type="number" value={taxRate * 100} onChange={e => setTaxRate(Number(e.target.value) / 100)} /></label>
          <label>Discount<select value={discountType} onChange={e => setDiscountType(e.target.value)}><option>%</option><option>₱</option></select><input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} /></label>
        </div>
        <div className="pos-message">{message}</div>
        <div className="products-grid">
          {products.map(p => (
            <div key={p.id} className={`product ${p.stock === 0 ? 'out' : ''}`} onClick={() => addToCart(p)} title={p.stock === 0 ? "Out of stock" : `Stock: ${formatNumber(p.stock)}`}>
              <h4>{p.name}</h4>
              <div>{formatCurrency(p.price)}</div>
              <div className={p.stock <= 3 ? 'low-stock' : ''}>{formatNumber(p.stock)} stock</div>
            </div>
          ))}
        </div>
      </div>
      <div className="pos-right">
        <h3>Cart ({cart.length})</h3>
        <div className="pos-cart-list">
          {cart.length === 0 && <div className="muted">Empty</div>}
          {cart.map(i => (
            <div className="cart-item" key={i.id}>
              <div>{i.name}</div>
              <input type="number" value={i.quantity} onChange={e => updateQuantity(i.id, Number(e.target.value))} />
              <div>{formatCurrency(i.price * i.quantity)}</div>
              <button type="button" onClick={() => removeItem(i.id)}>✕</button>
            </div>
          ))}
        </div>
        <hr className="pos-divider" />
        <div className="pos-line"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        {discount > 0 && <div className="pos-line"><span>Discount</span><span>-{discountType === '%' ? `${formatNumber(discount, { maximumFractionDigits: 2 })}%` : formatCurrency(discount)}</span></div>}
        <div className="pos-line"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
        <h3 className="pos-total">{formatCurrency(final)}</h3>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option>Cash</option>
          <option>Card</option>
          <option>E-Wallet</option>
        </select>
        {paymentMethod === 'Cash' && (
          <div>
            <input type="number" placeholder="Cash Received" onChange={e => setCashReceived(Number(e.target.value))} />
            <div className="change-line">Change: {formatCurrency(Math.max(0, change))}</div>
          </div>
        )}
        <button type="button" disabled={cart.length === 0 || loading} onClick={checkout}>
          {loading ? "Processing..." : "Checkout"}
        </button>
      </div>
    </div>
  );
}
