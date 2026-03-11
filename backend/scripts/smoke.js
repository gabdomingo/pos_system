(async () => {
  const paths = ['/products', '/products/seed'];
  for (const p of paths) {
    try {
      const r = await fetch('http://localhost:5000' + p);
      const txt = await r.text();
      console.log('==', p, 'status', r.status);
      console.log(txt);
    } catch (e) {
      console.error('ERR', p, e.message);
    }
  }
})();
