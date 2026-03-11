import React, { useState } from 'react';
import { API } from '../config';

export default function Register({ onRegister, onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [role, setRole] = useState('customer');

  function validateEmail(v) {
    // allow simple local-style emails (e.g. admin@local) for local dev
    const re = /^\S+@\S+$/;
    return re.test(v);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setEmailError('');
    if (!name.trim()) { setError('Please enter your full name'); return; }
    if (!validateEmail(email)) { setEmailError('Please enter a valid email'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password, role }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Register failed');
      onRegister({ token: data.token, user: data.user });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">POS</div>
          <div>
            <h3 className="auth-title">Create account</h3>
            <div className="auth-sub">Create a secure account to manage orders and products</div>
          </div>
        </div>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={submit} className="auth-form" aria-label="register form">
          <label className="auth-label">Full name</label>
          <input className="auth-input" placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)} />

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
            <input className="auth-input" placeholder="Create a password" type={showPassword? 'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="button" className="show-pass" onClick={()=>setShowPassword(s=>!s)} aria-label="show password">{showPassword? 'Hide':'Show'}</button>
          </div>

          <label className="auth-label">Confirm password</label>
          <input className="auth-input" placeholder="Confirm password" type={showPassword? 'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} />

          <div className="auth-actions">
            <button type="submit" className="primary" disabled={loading}>{loading? 'Creating...':'Create account'}</button>
          </div>
        </form>

        <div className="muted auth-footnote">
          Already have an account?{' '}
          <a
            href="/login"
            onClick={(e) => {
              if (!onNavigate) return;
              e.preventDefault();
              onNavigate('/login');
            }}
          >
            Log in
          </a>
        </div>
      </div>
    </div>
  );
}
