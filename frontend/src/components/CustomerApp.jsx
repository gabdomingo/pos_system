import React, { useEffect, useMemo, useState } from 'react';
import { API } from '../config';
import { PRODUCT_CATEGORIES } from '../constants/productCategories';
import { formatCurrency, formatNumber } from '../utils/format';
import {
  CHECKOUT_DEFAULTS,
  composeDeliveryAddress,
  getBarangayOptions,
  getMunicipalityOptions,
  getProvinceOptions,
  getSelectedMunicipality,
  isValidPhilippinePhone,
  isValidStandardEmail,
  normalizeEmail,
  normalizePhilippinePhone
} from '../utils/customerForm';
import Toast from './Toast';
import '../styles/customer.css';

const HERO_BANNER_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 520'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#1d4ed8'/>
        <stop offset='0.55' stop-color='#1e3a8a'/>
        <stop offset='1' stop-color='#0f172a'/>
      </linearGradient>
      <radialGradient id='glowA' cx='0' cy='0' r='1' gradientTransform='translate(220 430) rotate(32) scale(360 260)' gradientUnits='userSpaceOnUse'>
        <stop offset='0' stop-color='rgba(148, 197, 255, 0.30)'/>
        <stop offset='1' stop-color='rgba(148, 197, 255, 0)'/>
      </radialGradient>
      <radialGradient id='glowB' cx='0' cy='0' r='1' gradientTransform='translate(990 100) rotate(18) scale(310 240)' gradientUnits='userSpaceOnUse'>
        <stop offset='0' stop-color='rgba(255, 255, 255, 0.18)'/>
        <stop offset='1' stop-color='rgba(255, 255, 255, 0)'/>
      </radialGradient>
      <linearGradient id='panel' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='rgba(255,255,255,0.16)'/>
        <stop offset='1' stop-color='rgba(255,255,255,0.04)'/>
      </linearGradient>
      <linearGradient id='screen' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#0f172a'/>
        <stop offset='1' stop-color='#1d4ed8'/>
      </linearGradient>
    </defs>
    <rect width='1200' height='520' rx='32' fill='url(#g)'/>
    <rect width='1200' height='520' rx='32' fill='url(#glowA)'/>
    <rect width='1200' height='520' rx='32' fill='url(#glowB)'/>
    <g opacity='0.14' stroke='rgba(255,255,255,0.22)'>
      <path d='M0 128H1200'/>
      <path d='M0 256H1200'/>
      <path d='M0 384H1200'/>
      <path d='M220 0V520'/>
      <path d='M440 0V520'/>
      <path d='M660 0V520'/>
      <path d='M880 0V520'/>
    </g>
    <g transform='translate(760 118)'>
      <rect width='278' height='170' rx='28' fill='url(#panel)' stroke='rgba(255,255,255,0.18)'/>
      <rect x='26' y='24' width='226' height='114' rx='18' fill='url(#screen)' stroke='rgba(191,219,254,0.55)'/>
      <rect x='112' y='146' width='56' height='10' rx='5' fill='rgba(219,234,254,0.75)'/>
    </g>
    <g transform='translate(160 172)'>
      <rect width='152' height='152' rx='34' fill='rgba(255,255,255,0.11)' stroke='rgba(255,255,255,0.18)'/>
      <rect x='30' y='30' width='92' height='92' rx='22' fill='rgba(191,219,254,0.2)' stroke='rgba(255,255,255,0.25)'/>
      <circle cx='76' cy='76' r='22' fill='rgba(255,255,255,0.22)'/>
      <circle cx='76' cy='76' r='8' fill='rgba(219,234,254,0.82)'/>
    </g>
    <g transform='translate(438 308)'>
      <rect width='228' height='84' rx='24' fill='rgba(255,255,255,0.09)' stroke='rgba(255,255,255,0.16)'/>
      <rect x='22' y='18' width='124' height='12' rx='6' fill='rgba(255,255,255,0.72)'/>
      <rect x='22' y='42' width='182' height='10' rx='5' fill='rgba(191,219,254,0.44)'/>
      <rect x='22' y='60' width='96' height='8' rx='4' fill='rgba(191,219,254,0.30)'/>
    </g>
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

const FULFILLMENT_OPTIONS = [
  { value: 'delivery', title: 'Delivery', copy: 'Free local delivery for online orders' },
  { value: 'pickup', title: 'Store Pickup', copy: 'Collect from the shop after confirmation' }
];

const PAYMENT_OPTIONS = [
  { value: 'Card', title: 'Credit or Debit Card', copy: 'Visa, Mastercard, or bank cards' },
  { value: 'GCash', title: 'GCash', copy: 'Pay via GCash then enter the reference number' },
  { value: 'Cash on Delivery', title: 'Cash on Delivery', copy: 'Pay the rider when your order arrives' }
];

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatCardNumber(value) {
  return digitsOnly(value).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
  const raw = digitsOnly(value).slice(0, 4);
  if (raw.length < 3) return raw;
  return `${raw.slice(0, 2)}/${raw.slice(2)}`;
}

function paymentDescriptor(form) {
  if (form.paymentMethod === 'Card') {
    const last4 = digitsOnly(form.cardNumber).slice(-4);
    return last4 ? `Card ending in ${last4}` : 'Card payment';
  }
  if (form.paymentMethod === 'GCash') {
    return form.paymentReference ? `GCash ref ${form.paymentReference}` : 'GCash payment';
  }
  return 'Cash on delivery';
}

function emptyCheckout(auth) {
  return {
    ...CHECKOUT_DEFAULTS,
    customerName: auth?.user?.name || '',
    customerEmail: auth?.user?.email || ''
  };
}

export default function CustomerApp({ setMode, auth, onLogout, onNavigate }) {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', category: '', price: '', stock: '', image: '' });
  const [adding, setAdding] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [addressTree, setAddressTree] = useState([]);
  const [checkoutForm, setCheckoutForm] = useState(() => emptyCheckout(auth));
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const canAddProduct = Boolean(auth && auth.user && (auth.user.role === 'admin' || auth.user.role === 'cashier'));
  const canUseCustomerCart = Boolean(auth && auth.user && auth.user.role === 'customer');

  useEffect(() => {
    fetchProducts();
    fetchAddressTree();
  }, []);

  useEffect(() => {
    if (!canAddProduct) setShowAddForm(false);
  }, [canAddProduct]);

  useEffect(() => {
    if (!canUseCustomerCart) {
      setCart([]);
      setShowCart(false);
    }
  }, [canUseCustomerCart]);

  useEffect(() => {
    if (cart.length === 0) {
      setShowCart(false);
      setCheckoutErrors({});
    }
  }, [cart.length]);

  useEffect(() => {
    setCheckoutForm((prev) => ({
      ...prev,
      customerName: prev.customerName || auth?.user?.name || '',
      customerEmail: prev.customerEmail || auth?.user?.email || ''
    }));
  }, [auth?.user?.name, auth?.user?.email]);

  const provinceOptions = useMemo(
    () => getProvinceOptions(addressTree, checkoutForm.regionCode),
    [addressTree, checkoutForm.regionCode]
  );
  const municipalityOptions = useMemo(
    () => getMunicipalityOptions(addressTree, checkoutForm.regionCode, checkoutForm.provinceName),
    [addressTree, checkoutForm.regionCode, checkoutForm.provinceName]
  );
  const barangayOptions = useMemo(
    () => getBarangayOptions(addressTree, checkoutForm.regionCode, checkoutForm.provinceName, checkoutForm.municipalityName),
    [addressTree, checkoutForm.regionCode, checkoutForm.provinceName, checkoutForm.municipalityName]
  );
  const selectedMunicipality = useMemo(
    () => getSelectedMunicipality(addressTree, checkoutForm.regionCode, checkoutForm.provinceName, checkoutForm.municipalityName),
    [addressTree, checkoutForm.regionCode, checkoutForm.provinceName, checkoutForm.municipalityName]
  );

  const filtered = useMemo(() => products.filter((product) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return product.name.toLowerCase().includes(needle) || (product.category || '').toLowerCase().includes(needle);
  }), [products, q]);
  const categorySummary = useMemo(() => {
    const counts = new Map();
    for (const product of products) {
      const category = product.category || 'Uncategorized';
      const current = counts.get(category) || { name: category, count: 0, inStock: 0 };
      current.count += 1;
      if (Number(product.stock || 0) > 0) current.inStock += 1;
      counts.set(category, current);
    }

    return PRODUCT_CATEGORIES
      .map((category) => counts.get(category) || { name: category, count: 0, inStock: 0 })
      .filter((category) => category.count > 0);
  }, [products]);
  const categoryCount = useMemo(() => new Set(products.map((product) => product.category || 'Uncategorized')).size, [products]);
  const inStockProducts = useMemo(() => products.filter((product) => Number(product.stock || 0) > 0).length, [products]);
  const topCategory = categorySummary[0]?.name || '';
  const heroMetrics = [
    { label: 'Products Ready', value: formatNumber(inStockProducts) },
    { label: 'Categories', value: formatNumber(categoryCount) },
    { label: 'Ways to Pay', value: '3' }
  ];
  const storefrontBenefits = [
    { title: 'Live Stock Visibility', copy: 'Customers can see what is available before they commit.' },
    { title: 'Flexible Payment', copy: 'Card, GCash, and Cash on Delivery are available in one flow.' },
    { title: 'Pickup or Delivery', copy: 'Shoppers can choose the fulfillment option that fits their schedule.' }
  ];
  const heroProofPoints = ['Live stock updates', 'Pickup or delivery', 'Card, GCash, or COD'];

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const checkoutButtonLabel = checkoutForm.paymentMethod === 'Cash on Delivery' ? 'Place Delivery Order' : 'Pay and Place Order';

  async function fetchProducts() {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching products', e);
    }
  }

  async function fetchAddressTree() {
    try {
      const res = await fetch(`${API}/reference/ph-addresses`);
      const data = await res.json();
      setAddressTree(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching Philippine addresses', e);
    }
  }

  function setFlashMessage(text, duration = 2500) {
    setMessage(text);
    if (duration > 0) {
      setTimeout(() => setMessage(''), duration);
    }
  }

  function promptCustomerLogin(text) {
    setFlashMessage(text, 2800);
    if (onNavigate) {
      window.setTimeout(() => onNavigate('/login'), 220);
      return;
    }
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        window.location.href = '/login';
      }, 220);
    }
  }

  function openDetail(product) {
    setSelected(product);
  }

  function addToCart(product, qty = 1) {
    if (!canUseCustomerCart) {
      promptCustomerLogin('Please log in as a customer to use the cart.');
      return;
    }
    if (product.stock === 0) {
      setFlashMessage('This item is out of stock.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id
          ? { ...item, quantity: Math.min(product.stock, item.quantity + qty) }
          : item);
      }
      return [...prev, { ...product, quantity: qty }];
    });

    setFlashMessage('Added to cart.');
  }

  function updateQty(id, quantity) {
    setCart((prev) => prev.map((item) => item.id === id
      ? { ...item, quantity: Math.max(1, Math.min(item.stock, quantity)) }
      : item));
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function clearCheckoutErrors(fields) {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    setCheckoutErrors((prev) => {
      if (!prev || Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const field of fieldList) {
        if (field && Object.prototype.hasOwnProperty.call(next, field)) {
          delete next[field];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  function updateCheckoutField(field, value) {
    setCheckoutForm((prev) => ({ ...prev, [field]: value }));
    clearCheckoutErrors(field);
  }

  function selectRegion(regionCode) {
    setCheckoutForm((prev) => ({
      ...prev,
      regionCode,
      provinceName: '',
      municipalityName: '',
      barangayName: '',
      postalCode: ''
    }));
    clearCheckoutErrors(['regionCode', 'provinceName', 'municipalityName', 'barangayName', 'postalCode']);
  }

  function selectProvince(provinceName) {
    setCheckoutForm((prev) => ({
      ...prev,
      provinceName,
      municipalityName: '',
      barangayName: '',
      postalCode: ''
    }));
    clearCheckoutErrors(['provinceName', 'municipalityName', 'barangayName', 'postalCode']);
  }

  function selectMunicipality(municipalityName) {
    const municipality = getSelectedMunicipality(addressTree, checkoutForm.regionCode, checkoutForm.provinceName, municipalityName);
    setCheckoutForm((prev) => ({
      ...prev,
      municipalityName,
      barangayName: '',
      postalCode: municipality?.postalCode || ''
    }));
    clearCheckoutErrors(['municipalityName', 'barangayName', 'postalCode']);
  }

  function selectPaymentMethod(method) {
    setCheckoutForm((prev) => ({
      ...prev,
      paymentMethod: method,
      paymentReference: method === 'GCash' ? prev.paymentReference : '',
      cardHolder: method === 'Card' ? prev.cardHolder : '',
      cardNumber: method === 'Card' ? prev.cardNumber : '',
      cardExpiry: method === 'Card' ? prev.cardExpiry : '',
      cardCvv: method === 'Card' ? prev.cardCvv : ''
    }));
    clearCheckoutErrors(['paymentMethod', 'paymentReference', 'cardHolder', 'cardNumber', 'cardExpiry', 'cardCvv', 'gcashNumber']);
  }

  function selectFulfillmentType(value) {
    setCheckoutForm((prev) => {
      const next = { ...prev, fulfillmentType: value };
      if (value === 'pickup' && prev.paymentMethod === 'Cash on Delivery') {
        next.paymentMethod = 'Card';
      }
      if (value === 'pickup') {
        next.regionCode = '';
        next.provinceName = '';
        next.municipalityName = '';
        next.barangayName = '';
        next.postalCode = '';
        next.deliveryAddress = '';
        next.landmark = '';
      }
      return next;
    });
    clearCheckoutErrors(['regionCode', 'provinceName', 'municipalityName', 'barangayName', 'postalCode', 'deliveryAddress', 'paymentMethod']);
  }

  function collectCheckoutErrors() {
    const errors = {};
    if (cart.length === 0) errors.cart = 'Your cart is empty.';
    if (!checkoutForm.customerName.trim()) errors.customerName = 'Enter the customer name.';
    if (!isValidPhilippinePhone(checkoutForm.customerPhone)) errors.customerPhone = 'Enter a valid Philippine mobile number.';
    if (checkoutForm.customerEmail && !isValidStandardEmail(checkoutForm.customerEmail)) errors.customerEmail = 'Enter a valid email address.';
    if (checkoutForm.fulfillmentType === 'delivery') {
      if (!checkoutForm.regionCode) errors.regionCode = 'Select the region.';
      if (!checkoutForm.provinceName) errors.provinceName = 'Select the province.';
      if (!checkoutForm.municipalityName) errors.municipalityName = 'Select the municipality or city.';
      if (!checkoutForm.barangayName) errors.barangayName = 'Select the barangay.';
      if (!selectedMunicipality?.postalCode) errors.postalCode = 'Postal code is unavailable for the selected area.';
      if (!checkoutForm.deliveryAddress.trim()) errors.deliveryAddress = 'Enter the house number, street, or building.';
    }
    if (checkoutForm.paymentMethod === 'Card') {
      if (!checkoutForm.cardHolder.trim()) errors.cardHolder = 'Enter the card holder name.';
      if (digitsOnly(checkoutForm.cardNumber).length !== 16) errors.cardNumber = 'Enter a valid 16-digit card number.';
      if (!/^\d{2}\/\d{2}$/.test(checkoutForm.cardExpiry)) errors.cardExpiry = 'Enter the card expiry as MM/YY.';
      if (digitsOnly(checkoutForm.cardCvv).length < 3) errors.cardCvv = 'Enter a valid card CVV.';
    }
    if (checkoutForm.paymentMethod === 'GCash') {
      if (!isValidPhilippinePhone(checkoutForm.gcashNumber || checkoutForm.customerPhone)) errors.gcashNumber = 'Enter the GCash mobile number.';
      if (!checkoutForm.paymentReference.trim()) errors.paymentReference = 'Enter the GCash reference number.';
    }
    if (checkoutForm.paymentMethod === 'Cash on Delivery' && checkoutForm.fulfillmentType !== 'delivery') {
      errors.paymentMethod = 'Cash on Delivery is only available for delivery orders.';
    }
    return errors;
  }

  function firstCheckoutError(errors) {
    return Object.values(errors)[0] || '';
  }

  function getCheckoutFieldClass(field) {
    return `checkout-control ${checkoutErrors[field] ? 'invalid' : ''}`.trim();
  }

  function getCheckoutFieldWrapperClass(field) {
    return `checkout-field ${checkoutErrors[field] ? 'invalid' : ''}`.trim();
  }

  function renderCheckoutError(field) {
    if (!checkoutErrors[field]) return null;
    return <span className="checkout-field-error">{checkoutErrors[field]}</span>;
  }

  async function checkout() {
    if (!canUseCustomerCart) {
      promptCustomerLogin('Customer login required before checkout.');
      return;
    }

    const validationErrors = collectCheckoutErrors();
    if (Object.keys(validationErrors).length > 0) {
      setCheckoutErrors(validationErrors);
      setFlashMessage(firstCheckoutError(validationErrors), 3000);
      return;
    }

    setCheckoutErrors({});
    setPlacingOrder(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API}/sales`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          saleChannel: 'online',
          paymentMethod: checkoutForm.paymentMethod,
          fulfillmentType: checkoutForm.fulfillmentType,
          customerName: checkoutForm.customerName.trim(),
          customerPhone: normalizePhilippinePhone(checkoutForm.customerPhone),
          customerEmail: normalizeEmail(checkoutForm.customerEmail),
          deliveryAddress: checkoutForm.fulfillmentType === 'delivery' ? composeDeliveryAddress(checkoutForm, addressTree) : '',
          paymentReference: checkoutForm.paymentMethod === 'GCash' ? checkoutForm.paymentReference.trim() : '',
          cardNumber: checkoutForm.paymentMethod === 'Card' ? digitsOnly(checkoutForm.cardNumber) : '',
          items: cart.map((item) => ({ id: item.id, quantity: item.quantity }))
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      setReceipt(data.receipt || null);
      setCart([]);
      setShowCart(false);
      setCheckoutForm((prev) => ({
        ...emptyCheckout(auth),
        customerPhone: prev.customerPhone,
        regionCode: prev.regionCode,
        provinceName: prev.provinceName,
        municipalityName: prev.municipalityName,
        barangayName: prev.barangayName,
        postalCode: prev.postalCode,
        deliveryAddress: prev.deliveryAddress,
        landmark: prev.landmark
      }));
      setFlashMessage(data.receiptNumber ? `Order placed. Receipt: ${data.receiptNumber}` : 'Order placed successfully.', 3200);
      try {
        window.dispatchEvent(new CustomEvent('sale:created', { detail: { saleId: data.saleId || data.receipt?.id || null } }));
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: data.receiptNumber ? `Thank you. ${data.receiptNumber}` : 'Thank you. Order placed.' } }));
      } catch (e) {
        // ignore event errors in older browsers
      }
    } catch (e) {
      setFlashMessage(`Checkout error: ${e.message || ''}`, 3200);
    } finally {
      setPlacingOrder(false);
      fetchProducts();
    }
  }

  return (
    <div className="customer-root">
      <header className="customer-header">
        <div className="customer-left">
          <div className="customer-brand-block">
            <div className="customer-logo" onClick={() => { setMode('customer'); if (onNavigate) onNavigate('/'); else window.history.pushState({}, '', '/'); }}>
              <span className="customer-logo-mark">CP</span>
              <span className="customer-logo-copy">
                <span className="customer-logo-name">Charlie PC</span>
                <span className="customer-logo-subtitle">Parts, builds, and essentials</span>
              </span>
            </div>
          </div>
        </div>

        <div className="customer-actions">
          <div className="search-wrap">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parts, builds, or accessories" className="search-input" />
          </div>
          {auth?.user?.role === 'customer' && (
            <div className="customer-welcome-chip">Welcome, {auth.user.name || auth.user.email}</div>
          )}
          {canUseCustomerCart && cartItemCount > 0 && (
            <button className="cart-btn" onClick={() => setShowCart((state) => !state)} aria-label="Toggle cart">
              Cart <span className="cart-badge">{formatNumber(cartItemCount)}</span>
            </button>
          )}
          {auth && auth.user ? (
            <button onClick={onLogout} className="btn-ghost">Logout</button>
          ) : (
            <button onClick={() => { if (onNavigate) onNavigate('/login'); else window.location.href = '/login'; }} className="primary">Login</button>
          )}
        </div>
      </header>

      <section className="hero" aria-label="Store highlights">
        <div className="hero-shell">
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
              <div className="hero-copy-card">
                <div className="hero-kicker">Charlie PC Storefront</div>
                <h3>Build the setup you want with parts ready for pickup or delivery.</h3>
                <p>Shop with clear stock, straightforward pricing, and a smoother checkout flow for Card, GCash, or Cash on Delivery.</p>
                <div className="hero-proof-list">
                  {heroProofPoints.map((item) => (
                    <span key={item} className="hero-proof-pill">{item}</span>
                  ))}
                </div>
                <div className="hero-actions">
                  <button type="button" className="primary" onClick={() => setQ('')}>Shop All Products</button>
                  <button type="button" className="btn-ghost hero-secondary" onClick={() => (cart.length > 0 ? setShowCart(true) : setQ(topCategory))}>
                    {cart.length > 0 ? `Open Cart (${formatNumber(cartItemCount)})` : `Browse ${topCategory || 'Top Picks'}`}
                  </button>
                </div>
                <div className="hero-stats">
                  {heroMetrics.map((item) => (
                    <div key={item.label} className="hero-stat">
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <aside className="hero-sidecard">
            <div className="hero-sidecard-title">Why customers shop here</div>
            <div className="hero-sidecard-copy">Everything important is visible early: stock status, payment options, and whether an item is ready for pickup or delivery.</div>
            <div className="hero-benefits">
              {storefrontBenefits.map((benefit) => (
                <div key={benefit.title} className="hero-benefit">
                  <strong>{benefit.title}</strong>
                  <span>{benefit.copy}</span>
                </div>
              ))}
            </div>
            <div className="hero-sidecard-panel">
              <div className="hero-sidecard-subtitle">Popular Categories</div>
              {categorySummary.map((category) => (
                <button key={category.name} type="button" className="hero-collection-link" onClick={() => setQ(category.name)}>
                  <span>{category.name}</span>
                  <small>{formatNumber(category.inStock)} ready now</small>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <main className="customer-main">
        <aside className="category-panel">
          <h4>Categories</h4>
          <div className="category-list">
            {categorySummary.map((category) => (
              <button key={category.name} className="category-item" onClick={() => setQ(category.name)}>
                {category.name}
              </button>
            ))}
            {categorySummary.length === 0 && PRODUCT_CATEGORIES.map((category) => (
              <button key={category} className="category-item" onClick={() => setQ(category)}>{category}</button>
            ))}
          </div>
          <div className="sidebar-assurance">
            <div className="sidebar-assurance-title">Shopping Perks</div>
            <div className="sidebar-assurance-item">Live stock updates</div>
            <div className="sidebar-assurance-item">GCash, card, and COD</div>
            <div className="sidebar-assurance-item">Store pickup or delivery</div>
          </div>
        </aside>

        <section className="products-area">
          {categorySummary.length > 0 && (
            <div className="collection-grid">
              {categorySummary.map((category) => (
                <button key={category.name} type="button" className="collection-card" onClick={() => setQ(category.name)}>
                  <span className="collection-kicker">Collection</span>
                  <strong>{category.name}</strong>
                  <span>{formatNumber(category.count)} items</span>
                  <small>{formatNumber(category.inStock)} available now</small>
                </button>
              ))}
            </div>
          )}

          <div className="products-header">
            <h2>Products</h2>
            <div className="products-meta">{formatNumber(filtered.length)} items</div>
            <div className="products-helper">Shop with clear stock status and ready-to-use payment options.</div>
            {canAddProduct && (
              <div className="products-header-actions">
                <button className="primary" onClick={() => setShowAddForm((state) => !state)}>{showAddForm ? 'Hide Add' : 'Add Product'}</button>
              </div>
            )}
          </div>

          {!canUseCustomerCart && (
            <div className="customer-auth-banner">
              <strong>Customer login required</strong>
              <span>Browse the catalog freely, then sign in as a customer before adding to cart or placing an order.</span>
            </div>
          )}

          {message && <Toast message={message} onClose={() => setMessage('')} />}

          {canAddProduct && showAddForm && (
            <div className="customer-add-wrap">
              <div className="customer-add-title">Add Product</div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!addForm.name.trim()) {
                    setFlashMessage('Name required');
                    return;
                  }
                  if (addForm.price === '' || Number(addForm.price) < 0) {
                    setFlashMessage('Invalid price');
                    return;
                  }
                  if (addForm.stock === '' || Number(addForm.stock) < 0) {
                    setFlashMessage('Invalid stock');
                    return;
                  }

                  setAdding(true);
                  try {
                    const token = (auth && auth.token) || localStorage.getItem('token');
                    if (!token) throw new Error('Please log in as admin or cashier');
                    const res = await fetch(`${API}/products`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                        name: addForm.name.trim(),
                        category: addForm.category.trim() || 'Uncategorized',
                        price: Number(addForm.price),
                        stock: Number(addForm.stock),
                        image: addForm.image || null
                      })
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data.error || data.message || res.statusText || 'Add failed');
                    setFlashMessage(data.error || data.message || 'Product added', 3000);
                    setAddForm({ name: '', category: '', price: '', stock: '', image: '' });
                    fetchProducts();
                  } catch (err) {
                    setFlashMessage(err.message || 'Error submitting product', 3000);
                  } finally {
                    setAdding(false);
                  }
                }}
                className="customer-add-form"
              >
                <input className="span-2" placeholder="Name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
                <input className="span-1" placeholder="Category" value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })} />
                <input className="span-1" placeholder="Price" type="number" step="0.01" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} />
                <input className="span-1" placeholder="Stock" type="number" value={addForm.stock} onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })} />
                <input className="span-2" placeholder="Image URL (optional)" value={addForm.image} onChange={(e) => setAddForm({ ...addForm, image: e.target.value })} />
                <button type="submit" className="primary span-1" disabled={adding}>{adding ? 'Adding...' : 'Submit'}</button>
              </form>
            </div>
          )}

          <div className="products-grid" aria-live="polite">
            {filtered.map((product) => (
              <article key={product.id} className="product-card" onClick={() => openDetail(product)}>
                <div className="product-media">
                  <div className="product-badges">
                    <span className={`product-badge ${product.stock === 0 ? 'soldout' : product.stock <= 3 ? 'limited' : 'ready'}`}>
                      {product.stock === 0 ? 'Out of Stock' : product.stock <= 3 ? `Only ${formatNumber(product.stock)} left` : 'Ready to Order'}
                    </span>
                  </div>
                  <img
                    src={product.image || PRODUCT_IMAGE_PLACEHOLDER}
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
                    }}
                  />
                </div>
                <div className="product-body">
                  <div className="product-title">{product.name}</div>
                  <div className="product-cat">{product.category}</div>
                  <div className="product-price">{formatCurrency(product.price)}</div>
                  <div className="product-supporting">{product.stock > 0 ? 'Pay with Card, GCash, or Cash on Delivery' : 'Browse similar items while this product is unavailable'}</div>
                  <div className="product-actions">
                    <button className="primary product-primary" onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }} disabled={product.stock === 0}>
                      {canUseCustomerCart ? 'Add to Cart' : 'Login to Order'}
                    </button>
                    <button className="btn-link" onClick={(e) => { e.stopPropagation(); openDetail(product); }}>Quick View</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {selected && (
        <div className="modal" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
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
              <div className="detail-points">
                <div className="detail-point">{selected.stock > 0 ? `${formatNumber(selected.stock)} in stock` : 'Currently unavailable'}</div>
                <div className="detail-point">Card, GCash, or Cash on Delivery</div>
                <div className="detail-point">Delivery or store pickup</div>
              </div>
              <p>{selected.description || 'No description available.'}</p>
              <div className="modal-actions">
                <button onClick={() => addToCart(selected, 1)} className="primary">
                  {canUseCustomerCart ? 'Add to cart' : 'Login to order'}
                </button>
                <button onClick={() => setSelected(null)} className="btn-ghost">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCart && canUseCustomerCart && cart.length > 0 && (
        <div className="checkout-overlay" onClick={() => setShowCart(false)}>
          <aside className="checkout-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-sheet-header">
              <div>
                <div className="checkout-kicker">Shopping Cart</div>
                <h4>Review your cart</h4>
                <p>Choose delivery and payment, then place the order.</p>
              </div>
              <button className="btn-ghost" onClick={() => setShowCart(false)}>Close</button>
            </div>

            <div className="checkout-sheet-body">
              <section className="checkout-section">
                <div className="checkout-section-head">
                  <h5>Cart Items</h5>
                  <span>{formatNumber(cartItemCount)} item(s)</span>
                </div>
                {cart.length === 0 ? (
                  <div className="checkout-empty">Your cart is empty.</div>
                ) : (
                  <div className="checkout-items">
                    {cart.map((item) => (
                      <div key={item.id} className="checkout-item-row">
                        <div className="checkout-item-copy">
                          <div className="checkout-item-title">{item.name}</div>
                          <div className="checkout-item-meta">{formatCurrency(item.price)} each</div>
                        </div>
                        <div className="checkout-item-actions">
                          <input type="number" value={item.quantity} min={1} max={item.stock} onChange={(e) => updateQty(item.id, Number(e.target.value))} />
                          <strong>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</strong>
                          <button className="btn-link" onClick={() => removeItem(item.id)}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="checkout-section">
                <div className="checkout-section-head">
                  <h5>Delivery Details</h5>
                  <span>Who should receive this order?</span>
                </div>

                <div className="checkout-choice-grid">
                  {FULFILLMENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`checkout-choice ${checkoutForm.fulfillmentType === option.value ? 'active' : ''}`}
                      onClick={() => selectFulfillmentType(option.value)}
                    >
                      <span className="checkout-choice-title">{option.title}</span>
                      <span className="checkout-choice-copy">{option.copy}</span>
                    </button>
                  ))}
                </div>

                <div className="checkout-field-grid">
                  <label className={getCheckoutFieldWrapperClass('customerName')}>
                    Full Name
                    <input className={getCheckoutFieldClass('customerName')} value={checkoutForm.customerName} onChange={(e) => updateCheckoutField('customerName', e.target.value)} placeholder="Juan Dela Cruz" aria-invalid={Boolean(checkoutErrors.customerName)} />
                    {renderCheckoutError('customerName')}
                  </label>
                  <label className={getCheckoutFieldWrapperClass('customerPhone')}>
                    Mobile Number
                    <input className={getCheckoutFieldClass('customerPhone')} value={checkoutForm.customerPhone} onChange={(e) => updateCheckoutField('customerPhone', normalizePhilippinePhone(e.target.value))} placeholder="09XXXXXXXXX" aria-invalid={Boolean(checkoutErrors.customerPhone)} />
                    {renderCheckoutError('customerPhone')}
                  </label>
                  <label className={getCheckoutFieldWrapperClass('customerEmail')}>
                    Email Address
                    <input className={getCheckoutFieldClass('customerEmail')} value={checkoutForm.customerEmail} onChange={(e) => updateCheckoutField('customerEmail', e.target.value)} placeholder="name@example.com" aria-invalid={Boolean(checkoutErrors.customerEmail)} />
                    {renderCheckoutError('customerEmail')}
                  </label>
                  <div className="checkout-note-card">
                    <strong>{checkoutForm.fulfillmentType === 'delivery' ? 'Delivery Window' : 'Pickup Window'}</strong>
                    <span>{checkoutForm.fulfillmentType === 'delivery' ? 'Free local delivery. Rider confirmation follows after order review.' : 'Pickup is available during store hours once the order is packed.'}</span>
                  </div>
                </div>

                {checkoutForm.fulfillmentType === 'delivery' && (
                  <>
                    <div className="checkout-field-grid compact">
                      <label className={getCheckoutFieldWrapperClass('regionCode')}>
                        Region
                        <select className={getCheckoutFieldClass('regionCode')} value={checkoutForm.regionCode} onChange={(e) => selectRegion(e.target.value)} aria-invalid={Boolean(checkoutErrors.regionCode)}>
                          <option value="">Select region</option>
                          {addressTree.map((region) => (
                            <option key={region.code} value={region.code}>{region.name}</option>
                          ))}
                        </select>
                        {renderCheckoutError('regionCode')}
                      </label>
                      <label className={getCheckoutFieldWrapperClass('provinceName')}>
                        Province
                        <select className={getCheckoutFieldClass('provinceName')} value={checkoutForm.provinceName} onChange={(e) => selectProvince(e.target.value)} disabled={!checkoutForm.regionCode} aria-invalid={Boolean(checkoutErrors.provinceName)}>
                          <option value="">Select province</option>
                          {provinceOptions.map((province) => (
                            <option key={province.name} value={province.name}>{province.name}</option>
                          ))}
                        </select>
                        {renderCheckoutError('provinceName')}
                      </label>
                      <label className={getCheckoutFieldWrapperClass('municipalityName')}>
                        Municipality / City
                        <select className={getCheckoutFieldClass('municipalityName')} value={checkoutForm.municipalityName} onChange={(e) => selectMunicipality(e.target.value)} disabled={!checkoutForm.provinceName} aria-invalid={Boolean(checkoutErrors.municipalityName)}>
                          <option value="">Select municipality</option>
                          {municipalityOptions.map((municipality) => (
                            <option key={municipality.name} value={municipality.name}>{municipality.name}</option>
                          ))}
                        </select>
                        {renderCheckoutError('municipalityName')}
                      </label>
                      <label className={getCheckoutFieldWrapperClass('barangayName')}>
                        Barangay
                        <select className={getCheckoutFieldClass('barangayName')} value={checkoutForm.barangayName} onChange={(e) => updateCheckoutField('barangayName', e.target.value)} disabled={!checkoutForm.municipalityName} aria-invalid={Boolean(checkoutErrors.barangayName)}>
                          <option value="">Select barangay</option>
                          {barangayOptions.map((barangay) => (
                            <option key={barangay} value={barangay}>{barangay}</option>
                          ))}
                        </select>
                        {renderCheckoutError('barangayName')}
                      </label>
                    </div>
                    <div className="checkout-field-grid compact">
                      <label className={getCheckoutFieldWrapperClass('postalCode')}>
                        Postal Code
                        <input className={getCheckoutFieldClass('postalCode')} value={selectedMunicipality?.postalCode || checkoutForm.postalCode} readOnly placeholder="Postal code" aria-invalid={Boolean(checkoutErrors.postalCode)} />
                        {renderCheckoutError('postalCode')}
                      </label>
                      <label className={getCheckoutFieldWrapperClass('deliveryAddress')}>
                        House No. / Street / Building
                        <input className={getCheckoutFieldClass('deliveryAddress')} value={checkoutForm.deliveryAddress} onChange={(e) => updateCheckoutField('deliveryAddress', e.target.value)} placeholder="Unit, street, subdivision" aria-invalid={Boolean(checkoutErrors.deliveryAddress)} />
                        {renderCheckoutError('deliveryAddress')}
                      </label>
                      <label className={getCheckoutFieldWrapperClass('landmark')}>
                        Landmark
                        <input className={getCheckoutFieldClass('landmark')} value={checkoutForm.landmark} onChange={(e) => updateCheckoutField('landmark', e.target.value)} placeholder="Near school, church, terminal" />
                      </label>
                    </div>
                    <div className="checkout-inline-note">
                      Delivery address follows a Philippine hierarchy: region, province, municipality or city, barangay, postal code, and the exact street details.
                    </div>
                  </>
                )}
              </section>

              <section className="checkout-section">
                <div className="checkout-section-head">
                  <h5>Payment</h5>
                  <span>Select the payment channel for this order</span>
                </div>

                <div className="checkout-choice-grid">
                  {PAYMENT_OPTIONS.filter((option) => !(checkoutForm.fulfillmentType === 'pickup' && option.value === 'Cash on Delivery')).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`checkout-choice ${checkoutForm.paymentMethod === option.value ? 'active' : ''}`}
                      onClick={() => selectPaymentMethod(option.value)}
                    >
                      <span className="checkout-choice-title">{option.title}</span>
                      <span className="checkout-choice-copy">{option.copy}</span>
                    </button>
                  ))}
                </div>

                {checkoutForm.paymentMethod === 'Card' && (
                  <div className="checkout-payment-panel">
                    <div className="card-preview">
                      <div className="card-preview-brand">Card Payment</div>
                      <div className="card-preview-number">{formatCardNumber(checkoutForm.cardNumber) || '0000 0000 0000 0000'}</div>
                      <div className="card-preview-meta">
                        <span>{checkoutForm.cardHolder || 'Card Holder'}</span>
                        <span>{checkoutForm.cardExpiry || 'MM/YY'}</span>
                      </div>
                    </div>
                    <div className="checkout-field-grid compact">
                      <label className={getCheckoutFieldWrapperClass('cardHolder')}>
                        Card Holder
                        <input className={getCheckoutFieldClass('cardHolder')} value={checkoutForm.cardHolder} onChange={(e) => updateCheckoutField('cardHolder', e.target.value)} placeholder="Name on card" aria-invalid={Boolean(checkoutErrors.cardHolder)} />
                        {renderCheckoutError('cardHolder')}
                      </label>
                      <label className={getCheckoutFieldWrapperClass('cardNumber')}>
                        Card Number
                        <input className={getCheckoutFieldClass('cardNumber')} value={checkoutForm.cardNumber} onChange={(e) => updateCheckoutField('cardNumber', formatCardNumber(e.target.value))} placeholder="1234 5678 9012 3456" inputMode="numeric" aria-invalid={Boolean(checkoutErrors.cardNumber)} />
                        {renderCheckoutError('cardNumber')}
                      </label>
                      <label className={getCheckoutFieldWrapperClass('cardExpiry')}>
                        Expiry
                        <input className={getCheckoutFieldClass('cardExpiry')} value={checkoutForm.cardExpiry} onChange={(e) => updateCheckoutField('cardExpiry', formatExpiry(e.target.value))} placeholder="MM/YY" inputMode="numeric" aria-invalid={Boolean(checkoutErrors.cardExpiry)} />
                        {renderCheckoutError('cardExpiry')}
                      </label>
                      <label className={getCheckoutFieldWrapperClass('cardCvv')}>
                        CVV
                        <input className={getCheckoutFieldClass('cardCvv')} value={checkoutForm.cardCvv} onChange={(e) => updateCheckoutField('cardCvv', digitsOnly(e.target.value).slice(0, 4))} placeholder="123" inputMode="numeric" aria-invalid={Boolean(checkoutErrors.cardCvv)} />
                        {renderCheckoutError('cardCvv')}
                      </label>
                    </div>
                    <div className="checkout-inline-note">This build stores only the masked last four digits on the receipt. Live card processing would need a payment gateway.</div>
                  </div>
                )}

                {checkoutForm.paymentMethod === 'GCash' && (
                  <div className="checkout-payment-panel gcash-panel">
                    <div className="gcash-panel-copy">
                      <strong>GCash Payment Flow</strong>
                      <p>Scan the merchant QR or send payment through GCash, then enter the mobile number used and the transfer reference below.</p>
                    </div>
                    <div className="checkout-field-grid compact">
                      <label className={getCheckoutFieldWrapperClass('gcashNumber')}>
                        GCash Number
                        <input className={getCheckoutFieldClass('gcashNumber')} value={checkoutForm.gcashNumber} onChange={(e) => updateCheckoutField('gcashNumber', normalizePhilippinePhone(e.target.value))} placeholder="09XXXXXXXXX" aria-invalid={Boolean(checkoutErrors.gcashNumber)} />
                        {renderCheckoutError('gcashNumber')}
                      </label>
                      <label className={getCheckoutFieldWrapperClass('paymentReference')}>
                        Reference Number
                        <input className={getCheckoutFieldClass('paymentReference')} value={checkoutForm.paymentReference} onChange={(e) => updateCheckoutField('paymentReference', e.target.value.toUpperCase())} placeholder="GCASH123456" aria-invalid={Boolean(checkoutErrors.paymentReference)} />
                        {renderCheckoutError('paymentReference')}
                      </label>
                    </div>
                    <div className="checkout-inline-note">This is a manual GCash confirmation flow. Live GCash integration would require merchant credentials and a payment provider.</div>
                  </div>
                )}

                {checkoutForm.paymentMethod === 'Cash on Delivery' && (
                  <div className="checkout-payment-panel cod-panel">
                    <strong>Cash on Delivery</strong>
                    <p>Pay the rider in cash when the order reaches your address. Prepare exact cash when possible to speed up handoff.</p>
                  </div>
                )}
              </section>

              <section className="checkout-summary-card">
                <div className="checkout-summary-row">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div className="checkout-summary-row">
                  <span>Fulfillment</span>
                  <strong>{checkoutForm.fulfillmentType === 'delivery' ? 'Free delivery' : 'Store pickup'}</strong>
                </div>
                <div className="checkout-summary-row">
                  <span>Payment</span>
                  <strong>{paymentDescriptor(checkoutForm)}</strong>
                </div>
                <div className="checkout-summary-row total">
                  <span>{checkoutForm.paymentMethod === 'Cash on Delivery' ? 'Amount Due on Delivery' : 'Amount Due Now'}</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <button type="button" className="primary checkout-cta" disabled={placingOrder || cart.length === 0} onClick={checkout}>
                  {placingOrder ? 'Submitting Order...' : checkoutButtonLabel}
                </button>
                {checkoutErrors.paymentMethod ? <div className="checkout-field-error checkout-summary-error">{checkoutErrors.paymentMethod}</div> : null}
                <div className="checkout-terms">By placing this order, you confirm that the cart, contact details, and payment method are correct.</div>
              </section>
            </div>
          </aside>
        </div>
      )}

      {receipt && (
        <div className="modal" onClick={() => setReceipt(null)}>
          <div className="modal-card checkout-receipt-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body checkout-receipt-body full-width">
              <div className="checkout-receipt-head">
                <div>
                  <div className="checkout-kicker">Order Confirmed</div>
                  <h3>{receipt.receiptNumber || 'Receipt'}</h3>
                  <p>{receipt.fulfillmentType === 'pickup' ? 'Your order is queued for store pickup.' : 'Your delivery details have been recorded.'}</p>
                </div>
                <div className="checkout-receipt-status">{receipt.status || 'completed'}</div>
              </div>

              <div className="checkout-receipt-grid">
                <div>
                  <strong>Customer</strong>
                  <span>{receipt.customerName || receipt.customer_name || checkoutForm.customerName || '-'}</span>
                </div>
                <div>
                  <strong>Payment</strong>
                  <span>{receipt.paymentMethod || '-'}</span>
                </div>
                <div>
                  <strong>Phone</strong>
                  <span>{receipt.customerPhone || receipt.customer_phone || '-'}</span>
                </div>
                <div>
                  <strong>Fulfillment</strong>
                  <span>{receipt.fulfillmentType || receipt.fulfillment_type || '-'}</span>
                </div>
                {(receipt.deliveryAddress || receipt.delivery_address) ? (
                  <div className="checkout-receipt-span">
                    <strong>Address</strong>
                    <span>{receipt.deliveryAddress || receipt.delivery_address}</span>
                  </div>
                ) : null}
                {(receipt.paymentReference || receipt.payment_reference || receipt.paymentLast4 || receipt.payment_last4) ? (
                  <div className="checkout-receipt-span">
                    <strong>Payment Reference</strong>
                    <span>{receipt.paymentReference || receipt.payment_reference || `Card ending in ${receipt.paymentLast4 || receipt.payment_last4}`}</span>
                  </div>
                ) : null}
              </div>

              <div className="receipt-lines customer-receipt-lines">
                {(receipt.items || []).map((item, index) => (
                  <div key={`${item.product_id || item.productId || index}-${index}`} className="receipt-line-item">
                    <div>
                      <strong>{item.productName || item.product_name}</strong>
                      <div className="muted">{formatNumber(item.quantity)} x {formatCurrency(item.price)}</div>
                    </div>
                    <div>{formatCurrency(item.lineTotal || item.line_total || 0)}</div>
                  </div>
                ))}
              </div>

              <div className="receipt-totals">
                <div className="pos-line"><span>Subtotal</span><span>{formatCurrency(receipt.subtotal || 0)}</span></div>
                <div className="pos-line"><span>Total</span><span>{formatCurrency(receipt.total || 0)}</span></div>
                <div className="pos-line"><span>{receipt.paymentMethod === 'Cash on Delivery' ? 'Due on Delivery' : 'Paid'}</span><span>{formatCurrency(receipt.amountTendered || receipt.amount_tendered || receipt.total || 0)}</span></div>
              </div>

              <div className="modal-actions">
                <button type="button" className="primary" onClick={() => setReceipt(null)}>Continue Shopping</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
