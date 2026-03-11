import React, { useEffect, useState } from 'react';
import { API } from '../config';

export default function Login({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  function validateEmail(v) {
    // allow simple local-style emails (e.g. admin@local) for local dev
    const re = /^\S+@\S+$/;
    return re.test(v);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setEmailError('');
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 4) {
      setError('Please enter your password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password, role }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin({ token: data.token, user: data.user });
      if (remember) {
        localStorage.setItem('remember_email', email);
      } else {
        localStorage.removeItem('remember_email');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('remember_email');
      if (saved) setEmail(saved);
    } catch (e) {}
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">POS</div>
          <div>
            <h3 className="auth-title">Welcome back</h3>
            <div className="auth-sub">Securely log in to manage your store or continue shopping</div>
          </div>
        </div>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={submit} className="auth-form" aria-label="login form">
          <label className="auth-label">Email</label>
          <input className="auth-input" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={!!emailError} />
          {emailError && <div className="text-danger">{emailError}</div>}

          <label className="auth-label">Role</label>
          <select className="auth-input" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>

          <label className="auth-label">Password</label>
          <div className="auth-password-wrap">
            <input className="auth-input" placeholder="Enter your password" type={showPassword? 'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} aria-describedby="pwdHelp" />
            <button type="button" className="show-pass" onClick={()=>setShowPassword(s=>!s)} aria-label="show password">{showPassword? 'Hide':'Show'}</button>
          </div>
          <div id="pwdHelp" className="muted">Use a strong password. Minimum 6 characters recommended.</div>

          <div className="auth-row">
            <label className="remember-toggle"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me</label>
            <a className="secondary-link" href="#">Forgot password?</a>
          </div>

          <div className="auth-actions">
            <button type="submit" className="primary" disabled={loading || !!emailError}>{loading? 'Logging in...':'Log in'}</button>
          </div>
        </form>

        <div className="muted auth-footnote">
          Don't have an account?{' '}
          <a
            href="/register"
            onClick={(e) => {
              if (!onNavigate) return;
              e.preventDefault();
              onNavigate('/register');
            }}
          >
            Create account
          </a>
        </div>
      </div>
    </div>
  );
}
