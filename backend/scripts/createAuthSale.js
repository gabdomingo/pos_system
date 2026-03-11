import fetch from 'node-fetch';

async function login() {
  const res = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@local', password: 'admin123' })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data.token;
}

(async () => {
  try {
    const token = await login();
    console.log('Got token, creating sale...');
    const payload = {
      items: [ { id: 1, quantity: 1, price: 0.5 } ],
      total: 0.5,
      paymentMethod: 'Cash'
    };
    const res = await fetch('http://localhost:5000/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const txt = await res.text();
    console.log('Status:', res.status);
    console.log(txt);
  } catch (e) {
    console.error('createAuthSale error:', e.message || e);
    process.exit(1);
  }
})();
