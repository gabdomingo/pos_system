import React, { useEffect, useMemo, useState } from 'react';
import { API } from '../config';
import { formatCurrency, formatNumber } from '../utils/format';

const QUICK_TENDER_VALUES = [200, 500, 1000, 2000];
const PAYMENT_METHODS = ['Cash', 'Card', 'GCash'];
const PRODUCT_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 112'>
    <defs>
      <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#eff6ff'/>
        <stop offset='1' stop-color='#dbeafe'/>
      </linearGradient>
    </defs>
    <rect width='160' height='112' rx='16' fill='url(#bg)'/>
    <rect x='42' y='26' width='76' height='48' rx='8' fill='none' stroke='#335c93' stroke-width='4'/>
    <path d='M49 75l18-18 14 12 18-20 14 26' fill='none' stroke='#335c93' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/>
    <text x='80' y='97' text-anchor='middle' fill='#1e3a5f' font-family='Arial, sans-serif' font-size='13' font-weight='700'>Charlie PC</text>
  </svg>`
)}`;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeCashInput(value) {
  const raw = String(value ?? '').replace(/[^\d.]/g, '');
  if (!raw) return '';
  const [whole, ...fractionParts] = raw.split('.');
  const normalizedWhole = whole.replace(/^0+(?=\d)/, '');
  const fraction = fractionParts.join('').slice(0, 2);
  if (raw.includes('.')) {
    return `${normalizedWhole || '0'}.${fraction}`;
  }
  return normalizedWhole;
}

function getInitials(name) {
  return String(name || 'PC')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'PC';
}

export default function POS({ auth, cashierMode = false, onLogout }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [taxRate, setTaxRate] = useState(0.12);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('%');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('neutral');
  const [receipt, setReceipt] = useState(null);
  const [clock, setClock] = useState(new Date());

  const cashierName = auth?.user?.name || auth?.user?.email || 'Cashier';
  const shiftLabel = cashierMode ? 'Cashier Counter' : 'POS Terminal';

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function setNotice(text, tone = 'neutral') {
    setMessage(text);
    setMessageTone(tone);
  }

  async function fetchProducts() {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setNotice('Error loading products', 'error');
    }
  }

  const categories = useMemo(() => {
    const unique = new Set(products.map((product) => product.category || 'Uncategorized'));
    return ['All', ...Array.from(unique)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === 'All' || (product.category || 'Uncategorized') === category;
      if (!matchesCategory) return false;
      if (!needle) return true;
      return String(product.name || '').toLowerCase().includes(needle)
        || String(product.category || '').toLowerCase().includes(needle);
    });
  }, [products, search, category]);

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cart]
  );

  const discountAmount = discount
    ? (discountType === '%' ? subtotal * (Math.min(Number(discount) || 0, 100) / 100) : Number(discount || 0))
    : 0;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const tax = taxableBase * taxRate;
  const final = taxableBase + tax;
  const cashReceivedValue = Number(cashReceived || 0);
  const change = cashReceivedValue - final;
  const cashInputInvalid = paymentMethod === 'Cash' && cart.length > 0 && cashReceivedValue < final;
  const canProcess = cart.length > 0 && !loading && (paymentMethod !== 'Cash' || cashReceivedValue >= final);

  function addToCart(product) {
    if (Number(product.stock || 0) <= 0) {
      setNotice('This product is out of stock.', 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= Number(product.stock || 0)) {
          setNotice('Cannot exceed available stock.', 'error');
          return prev;
        }
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setNotice(`${product.name} added to sale.`, 'success');
  }

  function updateQuantity(id, quantity) {
    const product = products.find((entry) => entry.id === id);
    if (!product) return;
    const nextQuantity = Math.max(1, Math.min(Number(product.stock || 0), Number(quantity || 1)));
    setCart((prev) => prev.map((item) => item.id === id ? { ...item, quantity: nextQuantity } : item));
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function clearSale() {
    setCart([]);
    setPaymentMethod('Cash');
    setCashReceived('');
    setDiscount(0);
    setTaxRate(0.12);
    setNotice('Current sale cleared.', 'neutral');
  }

  function selectPaymentMethod(nextMethod) {
    setPaymentMethod(nextMethod);
    if (nextMethod !== 'Cash') {
      setCashReceived('');
    }
  }

  function appendCashValue(value) {
    setPaymentMethod('Cash');
    setCashReceived((prev) => {
      if (value === '.' && String(prev || '').includes('.')) return prev;
      const base = String(prev || '');
      const next = value === '.' && !base ? '0.' : `${base}${value}`;
      return normalizeCashInput(next);
    });
  }

  function backspaceCash() {
    setCashReceived((prev) => normalizeCashInput(String(prev || '').slice(0, -1)));
  }

  function setQuickTender(amount) {
    setPaymentMethod('Cash');
    setCashReceived(String(Number(amount || 0).toFixed(2)));
  }

  async function checkout() {
    if (cart.length === 0) {
      setNotice('No items in the current sale.', 'error');
      return;
    }

    if (paymentMethod === 'Cash' && cashReceivedValue < final) {
      setNotice('Cash received is not enough.', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = (auth && auth.token) || localStorage.getItem('token');
      if (!token) {
        throw new Error('Cashier login is required to process payment');
      }

      const res = await fetch(`${API}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          saleChannel: 'pos',
          paymentMethod,
          taxRate,
          discountType,
          discountValue: Number(discount || 0),
          amountTendered: paymentMethod === 'Cash' ? cashReceivedValue : undefined,
          items: cart.map((item) => ({ id: item.id, quantity: item.quantity }))
        })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setReceipt(data.receipt || null);
      setNotice(data.receiptNumber ? `Sale recorded: ${data.receiptNumber}` : 'Sale completed successfully', 'success');
      setCart([]);
      setPaymentMethod('Cash');
      setCashReceived('');
      await fetchProducts();
      try {
        window.dispatchEvent(new CustomEvent('sale:created', { detail: { saleId: data.saleId || data.receipt?.id || null } }));
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: data.receiptNumber ? `Payment complete - ${data.receiptNumber}` : 'Payment complete' } }));
      } catch (e) {
        // ignore browser event issues
      }
    } catch (e) {
      setNotice(`Payment error: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  function printReceipt(currentReceipt) {
    if (!currentReceipt || typeof window === 'undefined') return;
    const rows = (currentReceipt.items || []).map((item) => `
      <tr>
        <td>${escapeHtml(item.productName || item.product_name)}</td>
        <td style="text-align:center;">${escapeHtml(item.quantity)}</td>
        <td style="text-align:right;">${escapeHtml(formatCurrency(item.price || 0))}</td>
        <td style="text-align:right;">${escapeHtml(formatCurrency(item.lineTotal || item.line_total || 0))}</td>
      </tr>
    `).join('');

    const win = window.open('', '_blank', 'width=480,height=720');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${escapeHtml(currentReceipt.receiptNumber || 'Receipt')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 18px; margin-bottom: 8px; }
            .meta { margin-bottom: 16px; color: #4b5563; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 0; }
            th { text-align: left; color: #6b7280; }
            .totals { margin-top: 16px; font-size: 13px; }
            .totals div { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .grand { font-weight: 700; font-size: 15px; }
          </style>
        </head>
        <body>
          <h1>Charlie PC Receipt</h1>
          <div class="meta">
            <div>${escapeHtml(currentReceipt.receiptNumber || '')}</div>
            <div>${escapeHtml(new Date(currentReceipt.createdAt).toLocaleString())}</div>
            <div>Payment: ${escapeHtml(currentReceipt.paymentMethod || '-')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal</span><span>${escapeHtml(formatCurrency(currentReceipt.subtotal || 0))}</span></div>
            ${(Number(currentReceipt.discountAmount || currentReceipt.discount_amount || 0) > 0) ? `<div><span>Discount</span><span>-${escapeHtml(formatCurrency(currentReceipt.discountAmount || currentReceipt.discount_amount || 0))}</span></div>` : ''}
            ${(Number(currentReceipt.taxAmount || currentReceipt.tax_amount || 0) > 0) ? `<div><span>Tax</span><span>${escapeHtml(formatCurrency(currentReceipt.taxAmount || currentReceipt.tax_amount || 0))}</span></div>` : ''}
            <div class="grand"><span>Total</span><span>${escapeHtml(formatCurrency(currentReceipt.total || 0))}</span></div>
            <div><span>Tendered</span><span>${escapeHtml(formatCurrency(currentReceipt.amountTendered || currentReceipt.amount_tendered || currentReceipt.total || 0))}</span></div>
            <div><span>Change</span><span>${escapeHtml(formatCurrency(currentReceipt.changeAmount || currentReceipt.change_amount || 0))}</span></div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className={`page pos-terminal ${cashierMode ? 'cashier-mode' : ''}`}>
      <div className="pos-terminal-header">
        <div>
          <div className="pos-kicker">{shiftLabel}</div>
          <h2>Charlie PC Counter Sale</h2>
          <p>Welcome, {cashierName}. Scan products, review the basket, and collect payment in one flow.</p>
        </div>
        <div className="pos-header-actions">
          <div className="pos-shift-chip">
            <span>Terminal Ready</span>
            <strong>{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
          {cashierMode && onLogout ? (
            <button type="button" className="btn-ghost" onClick={onLogout}>Logout</button>
          ) : null}
        </div>
      </div>

      {message ? <div className={`pos-alert ${messageTone}`}>{message}</div> : null}

      <div className="pos-terminal-grid">
        <section className="pos-catalog-panel">
          <div className="pos-section-head">
            <div>
              <h3>Products</h3>
              <p>Tap an item to add it to the current sale.</p>
            </div>
            <div className="pos-section-meta">{formatNumber(filteredProducts.length)} items</div>
          </div>

          <div className="pos-search-row">
            <input
              className="pos-search-input"
              placeholder="Search product or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="pos-category-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="pos-products-grid">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className={`pos-product-card ${Number(product.stock || 0) <= 0 ? 'disabled' : ''}`}
                onClick={() => addToCart(product)}
                disabled={Number(product.stock || 0) <= 0}
                title={Number(product.stock || 0) <= 0 ? 'Out of stock' : `Add ${product.name}`}
              >
                <div className="pos-product-media">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
                      }}
                    />
                  ) : (
                    <div className="pos-product-fallback">{getInitials(product.name)}</div>
                  )}
                </div>
                <div className="pos-product-body">
                  <div className="pos-product-name">{product.name}</div>
                  <div className="pos-product-meta">{product.category || 'Uncategorized'}</div>
                  <div className="pos-product-bottom">
                    <strong>{formatCurrency(product.price || 0)}</strong>
                    <span className={Number(product.stock || 0) <= 3 ? 'low-stock' : ''}>
                      {Number(product.stock || 0) > 0 ? `${formatNumber(product.stock || 0)} left` : 'Out'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 ? (
              <div className="pos-empty-state">No products match this search.</div>
            ) : null}
          </div>
        </section>

        <section className="pos-basket-panel">
          <div className="pos-section-head">
            <div>
              <h3>Current Sale</h3>
              <p>{formatNumber(cartItemCount)} item(s) on the counter</p>
            </div>
            {cart.length > 0 ? (
              <button type="button" className="btn-link" onClick={clearSale}>Clear sale</button>
            ) : null}
          </div>

          <div className="pos-basket-list">
            {cart.length === 0 ? (
              <div className="pos-empty-state compact">Select products to start the transaction.</div>
            ) : cart.map((item) => (
              <div className="pos-basket-item" key={item.id}>
                <div className="pos-basket-copy">
                  <strong>{item.name}</strong>
                  <span>{formatCurrency(item.price || 0)} each</span>
                </div>
                <div className="pos-basket-actions">
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                  <span>{formatNumber(item.quantity)}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <div className="pos-basket-total">{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</div>
                <button type="button" className="pos-remove-btn" onClick={() => removeItem(item.id)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="pos-adjustments-card">
            <div className="pos-adjustments-head">Adjustments</div>
            <div className="pos-adjustments-grid">
              <label>
                Discount Type
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                  <option value="%">Percent</option>
                  <option value="₱">Peso</option>
                </select>
              </label>
              <label>
                Discount Value
                <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
              </label>
              <label>
                Tax Rate %
                <input type="number" min="0" step="0.01" value={taxRate * 100} onChange={(e) => setTaxRate(Number(e.target.value) / 100)} />
              </label>
            </div>
          </div>

          <div className="pos-summary-block">
            <div className="pos-line"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="pos-line"><span>Discount</span><span>-{formatCurrency(discountAmount)}</span></div>
            <div className="pos-line"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
            <div className="pos-line total"><span>Total Due</span><strong>{formatCurrency(final)}</strong></div>
          </div>
        </section>

        <section className="pos-payment-panel">
          <div className="pos-section-head">
            <div>
              <h3>Payment</h3>
              <p>Choose the payment type and finalize the sale.</p>
            </div>
          </div>

          <div className="pos-method-grid">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                type="button"
                className={`pos-method-btn ${paymentMethod === method ? 'active' : ''}`}
                onClick={() => selectPaymentMethod(method)}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === 'Cash' ? (
            <>
              <div className="pos-calc-display">{cashReceived || '0.00'}</div>
              <div className="pos-quick-tender-grid">
                {QUICK_TENDER_VALUES.map((amount) => (
                  <button key={amount} type="button" className="pos-quick-tender" onClick={() => setQuickTender(amount)}>
                    {formatCurrency(amount, 0)}
                  </button>
                ))}
                <button type="button" className="pos-quick-tender exact" onClick={() => setQuickTender(final)}>
                  Exact
                </button>
              </div>
              <div className="pos-keypad-grid">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.'].map((value) => (
                  <button key={value} type="button" className="pos-keypad-btn" onClick={() => appendCashValue(value)}>
                    {value}
                  </button>
                ))}
                <button type="button" className="pos-keypad-btn muted" onClick={backspaceCash}>⌫</button>
                <button type="button" className="pos-keypad-btn muted" onClick={() => setCashReceived('')}>Clear</button>
                <input
                  className={`pos-cash-input ${cashInputInvalid ? 'invalid' : ''}`}
                  inputMode="decimal"
                  placeholder="Manual cash amount"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(normalizeCashInput(e.target.value))}
                />
                {cashInputInvalid ? <div className="text-danger">Enter enough cash to cover the sale total.</div> : null}
              </div>
              <div className={`pos-change-card ${change < 0 ? 'short' : 'ready'}`}>
                <span>{change < 0 ? 'Still needed' : 'Change due'}</span>
                <strong>{formatCurrency(Math.abs(change))}</strong>
              </div>
            </>
          ) : (
            <div className="pos-payment-note">
              <strong>{paymentMethod === 'Card' ? 'Card terminal payment' : 'GCash confirmation'}</strong>
              <p>
                {paymentMethod === 'Card'
                  ? 'Confirm the card terminal approves the amount, then record the sale.'
                  : 'Confirm the e-wallet transfer on the customer device, then record the sale.'}
              </p>
              <div className="pos-payment-note-total">Amount to collect: {formatCurrency(final)}</div>
            </div>
          )}

          <button type="button" className="primary pos-process-btn" disabled={!canProcess} onClick={checkout}>
            {loading ? 'Processing...' : `Process ${paymentMethod} Payment`}
          </button>
        </section>
      </div>

      {receipt && (
        <div className="modal" onClick={() => setReceipt(null)}>
          <div className="modal-card receipt-card" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-head">
              <div>
                <h3>Receipt</h3>
                <div className="muted">{receipt.receiptNumber}</div>
              </div>
              <div className="receipt-status">{receipt.status || 'completed'}</div>
            </div>

            <div className="receipt-grid">
              <div>
                <strong>Date</strong>
                <div>{new Date(receipt.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <strong>Payment</strong>
                <div>{receipt.paymentMethod || '-'}</div>
              </div>
              <div>
                <strong>Cashier</strong>
                <div>{receipt.cashier || cashierName}</div>
              </div>
              <div>
                <strong>Channel</strong>
                <div>{receipt.saleChannel || receipt.sale_channel || 'pos'}</div>
              </div>
            </div>

            <div className="receipt-lines">
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
              {Number(receipt.discountAmount || receipt.discount_amount || 0) > 0 && (
                <div className="pos-line"><span>Discount</span><span>-{formatCurrency(receipt.discountAmount || receipt.discount_amount || 0)}</span></div>
              )}
              {Number(receipt.taxAmount || receipt.tax_amount || 0) > 0 && (
                <div className="pos-line"><span>Tax</span><span>{formatCurrency(receipt.taxAmount || receipt.tax_amount || 0)}</span></div>
              )}
              <div className="pos-line"><span>Tendered</span><span>{formatCurrency(receipt.amountTendered || receipt.amount_tendered || receipt.total || 0)}</span></div>
              <div className="pos-line"><span>Change</span><span>{formatCurrency(receipt.changeAmount || receipt.change_amount || 0)}</span></div>
              <h3 className="pos-total">{formatCurrency(receipt.total || 0)}</h3>
            </div>

            <div className="receipt-note">Totals, stock validation, and receipt numbering are confirmed on the server before the sale is completed.</div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => printReceipt(receipt)}>Print</button>
              <button type="button" className="btn-ghost" onClick={() => setReceipt(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
 );
}
