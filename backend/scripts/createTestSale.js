import fetch from 'node-fetch';

(async () => {
  try {
    const payload = {
      items: [ { id: 1, quantity: 1, price: 0.5 } ],
      total: 0.5,
      paymentMethod: 'Cash'
    };

    const res = await fetch('http://localhost:5000/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log(text);
  } catch (e) {
    console.error('createTestSale error:', e);
    process.exit(1);
  }
})();
