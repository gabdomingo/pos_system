import React, { useEffect, useState } from 'react';
import { API } from '../config';
import { authRoleOptions } from '../constants/authRoles';

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
    // keep the client-side check light; backend handles the full validation rules
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

  const selectedRole = authRoleOptions.find((option) => option.value === role) || authRoleOptions[0];

  return (
    <div className="auth-container login-page">
      <div className="login-shell">
        <aside className="login-showcase">
          <div className="login-showcase-panel">
            <div className="login-kicker">Charlie PC Store Portal</div>
            <h1 className="login-showcase-title">Build, sell, and shop PC gear in one clean workspace.</h1>
            <p className="login-showcase-copy">
              From processors and graphics cards to cashier checkout and sales reports, Charlie PC keeps the whole shop connected.
            </p>

            <div className="login-showcase-tags">
              <span>Gaming Builds</span>
              <span>PC Components</span>
              <span>Counter Checkout</span>
            </div>

            <div className="login-showcase-highlights">
              <div className="login-highlight-card">
                <div className="login-highlight-label">Inventory Ready</div>
                <strong>Products, stock, and pricing in one place</strong>
              </div>
              <div className="login-highlight-card">
                <div className="login-highlight-label">Sales Ready</div>
                <strong>Receipts, cashier flow, and customer checkout</strong>
              </div>
            </div>
          </div>
        </aside>

        <div className="auth-card login-card">
          <div className="login-topline">Store Access</div>

          <div className="auth-header login-header">
            <div className="auth-logo login-logo">CP</div>
            <div>
              <h3 className="auth-title">Welcome to Charlie PC</h3>
              <div className="auth-sub">Choose your access type first so the right workspace opens after login.</div>
            </div>
          </div>

          <div className="login-role-banner">
            <div className="login-role-banner-label">Signing in as</div>
            <strong>{selectedRole.label}</strong>
            <span>{selectedRole.copy}</span>
          </div>

          <div className="login-role-grid" aria-label="role selection">
            {authRoleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`login-role-card ${role === option.value ? 'active' : ''}`}
                onClick={() => setRole(option.value)}
                aria-pressed={role === option.value}
              >
                <span className="login-role-card-title">{option.label}</span>
                <span className="login-role-card-copy">{option.copy}</span>
                <span className="login-role-card-meta">{option.meta}</span>
              </button>
            ))}
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <form onSubmit={submit} className="auth-form" aria-label="login form">
            <label className="auth-label">Email</label>
            <input className="auth-input" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={!!emailError} />
            {emailError && <div className="text-danger">{emailError}</div>}

            <label className="auth-label">Password</label>
            <div className="auth-password-wrap">
              <input className="auth-input" placeholder={`Enter your ${selectedRole.label.toLowerCase()} password`} type={showPassword? 'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} aria-describedby="pwdHelp" />
              <button type="button" className="show-pass" onClick={()=>setShowPassword(s=>!s)} aria-label="show password">{showPassword? 'Hide':'Show'}</button>
            </div>
            <div id="pwdHelp" className="muted">Use the account that matches the selected role.</div>

            <div className="auth-row">
              <label className="remember-toggle login-remember"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me</label>
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
    </div>
  );
}
