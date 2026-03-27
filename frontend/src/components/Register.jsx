import React, { useState } from 'react';
import { API } from '../config';
import { authRoleOptions } from '../constants/authRoles';
import { isValidStandardEmail, normalizeEmail } from '../utils/customerForm';

export default function Register({ onRegister, onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const selectedRole = authRoleOptions.find((option) => option.value === 'customer') || authRoleOptions[0];

  async function submit(e) {
    e.preventDefault();
    setError('');
    setEmailError('');
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!isValidStandardEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: normalizeEmail(email), password, role: 'customer' })
      });
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
    <div className="auth-container login-page register-page">
      <div className="login-shell register-shell">
        <aside className="login-showcase register-showcase">
          <div className="login-showcase-panel register-showcase-panel">
            <div>
              <div className="login-kicker">Charlie PC Account Setup</div>
              <h1 className="login-showcase-title register-showcase-title">Create your customer account and start shopping immediately.</h1>
              <p className="login-showcase-copy register-showcase-copy">
                Customer self-registration stays simple and safe. Staff access is issued internally, while shoppers can create an account here and use the same clean Charlie PC flow on web or mobile.
              </p>

              <div className="login-showcase-tags">
                <span>Web and Mobile Ready</span>
                <span>Customer Checkout</span>
                <span>Safer Account Setup</span>
              </div>
            </div>

            <div className="register-support-grid">
              <div className="login-highlight-card register-support-card">
                <div className="login-highlight-label">Customer Signup</div>
                <strong>Create your shopping account here, then sign in on either web or mobile with the same credentials.</strong>
              </div>
              <div className="login-highlight-card register-support-card">
                <div className="login-highlight-label">Staff Access</div>
                <strong>Admin and cashier accounts are created internally and protected with an extra security code at login.</strong>
              </div>
            </div>
          </div>
        </aside>

        <div className="auth-card login-card register-card">
          <div className="login-topline">Create Access</div>

          <div className="auth-header login-header">
            <div className="auth-logo login-logo">CP</div>
            <div>
              <h3 className="auth-title">Create your Charlie PC account</h3>
              <div className="auth-sub">Customer self-registration is available here. Staff access is provisioned internally for security.</div>
            </div>
          </div>

          <div className="login-role-banner register-role-banner">
            <div className="login-role-banner-label">Registering as</div>
            <strong>{selectedRole.label}</strong>
            <span>{selectedRole.setup}</span>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <form onSubmit={submit} className="auth-form register-form" aria-label="register form">
            <div className="auth-field-grid">
              <div className="auth-field-block">
                <label className="auth-label">Full name</label>
                <input
                  className="auth-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="auth-field-block">
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-invalid={!!emailError}
                />
                {emailError && <div className="text-danger">{emailError}</div>}
              </div>
            </div>

            <div className="auth-helper-chips" aria-label="registration helper notes">
              <span>Minimum 8-character password</span>
              <span>{selectedRole.meta}</span>
              <span>Staff accounts are issued internally</span>
              <span>Ready for web and mobile</span>
            </div>

            <div className="auth-field-grid">
              <div className="auth-field-block">
                <label className="auth-label">Password</label>
                <div className="auth-password-wrap">
                  <input
                    className="auth-input"
                    placeholder="Create a password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="show-pass"
                    onClick={() => setShowPassword((state) => !state)}
                    aria-label="show password"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="auth-field-block">
                <label className="auth-label">Confirm password</label>
                <input
                  className="auth-input"
                  placeholder="Confirm password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="muted register-role-note">
              This account opens the customer storefront after sign-in. For cashier or admin access, ask the store administrator to issue a staff account.
            </div>

            <div className="auth-actions">
              <button type="submit" className="primary" disabled={loading || !!emailError}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
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
    </div>
  );
}
