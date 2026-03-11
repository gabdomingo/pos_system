import fetch from 'node-fetch';

async function run(){
  try{
    const login = await fetch('http://localhost:5000/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@local',password:'admin123'})});
    const j = await login.json();
    console.log('login', login.status, j);
    if (!login.ok) return;
    const token = j.token;
    const sales = await fetch('http://localhost:5000/sales', { headers: { Authorization: 'Bearer '+token } });
    console.log('sales status', sales.status);
    const sj = await sales.json();
    console.log('sales count', Array.isArray(sj)? sj.length : sj);
  }catch(e){ console.error('err', e.message); }
}

run();
