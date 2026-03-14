import fetch from 'node-fetch';

async function login() {
  const res = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@charliepc.ph', password: 'admin123' })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data.token;
}

(async () => {
  try {
    const token = await login();
    const res = await fetch('http://localhost:5000/sales', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    console.log('GET /sales status', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('getSalesAuth error:', e.message || e);
    process.exit(1);
  }
})();
