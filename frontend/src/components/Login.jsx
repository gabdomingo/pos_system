import React, { useEffect, useState } from 'react';
import { API } from '../config';
import { authRoleOptions } from '../constants/authRoles';

export default function Login({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [securityCode, setSecurityCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [forgotInfo, setForgotInfo] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotCodeRequested, setForgotCodeRequested] = useState(false);

  const requiresSecurityCode = role === 'admin' || role === 'cashier';

  function buildNetworkErrorMessage() {
    const target = API || window.location.origin;
    const isLocalTarget =
      !API ||
      /localhost|127\.0\.0\.1/i.test(target);

    if (isLocalTarget) {
      return `Can't reach the server at ${target}. Make sure the backend is running on port 5001.`;
    }

    return `Can't reach the server at ${target}. If the backend health check is already passing, add this frontend origin to ALLOWED_ORIGINS on Render and redeploy the backend.`;
  }

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
    if (requiresSecurityCode && !securityCode.trim()) {
      setError('Security code is required for admin and cashier login');
      return;
    }
    setLoading(true);
    try {
      let res;
      try {
        res = await fetch(`${API}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role, securityCode: securityCode.trim() })
        });
      } catch (networkError) {
        const rawMessage = typeof networkError?.message === 'string' ? networkError.message : '';
        const normalized = rawMessage.toLowerCase();
        const isConnectionError =
          normalized.includes('load failed') ||
          normalized.includes('failed to fetch') ||
          normalized.includes('networkerror');

        throw new Error(
          isConnectionError
            ? buildNetworkErrorMessage()
            : rawMessage || 'Login request failed before reaching the server.'
        );
      }

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        data = null;
      }

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

  useEffect(() => {
    if (role === 'customer') {
      setSecurityCode('');
    }
  }, [role]);

  async function requestPasswordReset(event) {
    event.preventDefault();
    setForgotError('');
    setForgotInfo('');

    if (!validateEmail(forgotEmail)) {
      setForgotError('Enter a valid email to request a reset code');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API}/api/forgot-password/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to request reset code');

      const demoCodeText = data.demoCode ? ` Demo code: ${data.demoCode}` : '';
      const ttlText = data.ttlMinutes ? ` It expires in ${data.ttlMinutes} minutes.` : '';
      setForgotInfo(`${data.message || 'Reset code prepared.'}${ttlText}${demoCodeText}`);
      setForgotCodeRequested(true);
    } catch (err) {
      setForgotError(err.message || 'Unable to request reset code');
    } finally {
      setForgotLoading(false);
    }
  }

  async function completePasswordReset(event) {
    event.preventDefault();
    setForgotError('');
    setForgotInfo('');

    if (!validateEmail(forgotEmail)) {
      setForgotError('Enter a valid email address');
      return;
    }
    if (!/^\d{6}$/.test(forgotCode.trim())) {
      setForgotError('Reset code must be 6 digits');
      return;
    }
    if (!forgotPassword || forgotPassword.length < 8) {
      setForgotError('New password must be at least 8 characters');
      return;
    }
    if (forgotPassword !== forgotConfirm) {
      setForgotError('Passwords do not match');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API}/api/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: forgotCode.trim(),
          newPassword: forgotPassword,
          confirmPassword: forgotConfirm
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to reset password');

      setForgotInfo(data.message || 'Password reset successful');
      setForgotCodeRequested(false);
      setPassword('');
      setForgotCode('');
      setForgotPassword('');
      setForgotConfirm('');
    } catch (err) {
      setForgotError(err.message || 'Unable to reset password');
    } finally {
      setForgotLoading(false);
    }
  }

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
            {!showForgotPassword && (
              <>
                <label className="auth-label">Email</label>
                <input className="auth-input" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={!!emailError} />
                {emailError && <div className="text-danger">{emailError}</div>}

                <label className="auth-label">Password</label>
                <div className="auth-password-wrap">
                  <input className="auth-input" placeholder={`Enter your ${selectedRole.label.toLowerCase()} password`} type={showPassword? 'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} aria-describedby="pwdHelp" />
                  <button type="button" className="show-pass" onClick={()=>setShowPassword(s=>!s)} aria-label="show password">{showPassword? 'Hide':'Show'}</button>
                </div>
                <div id="pwdHelp" className="muted">Use the account that matches the selected role.</div>

                {requiresSecurityCode && (
                  <>
                    <label className="auth-label">Security Code</label>
                    <input
                      className="auth-input"
                      placeholder={`Enter the ${selectedRole.label.toLowerCase()} security code`}
                      value={securityCode}
                      onChange={(e) => setSecurityCode(e.target.value)}
                      autoComplete="one-time-code"
                    />
                    <div className="muted auth-inline-note">
                      Staff sign-in now requires both the account password and the role security code.
                    </div>
                  </>
                )}
              </>
            )}

            <div className="auth-row">
              {!showForgotPassword && (
                <label className="remember-toggle login-remember"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me</label>
              )}
              <a
                className="secondary-link"
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  setShowForgotPassword((state) => {
                    const nextState = !state;
                    if (!nextState) {
                      setForgotCodeRequested(false);
                    }
                    return nextState;
                  });
                  setForgotEmail((current) => current || email);
                  setForgotError('');
                  setForgotInfo('');
                }}
              >
                {showForgotPassword ? 'Close forgot password' : 'Forgot password?'}
              </a>
            </div>

            {showForgotPassword && (
              <div className="auth-forgot-panel">
                <div className="auth-forgot-title">Reset your password</div>
                <div className="auth-forgot-copy">
                  Request a 6-digit reset code, then set a new password.
                </div>

                <label className="auth-label">Account email</label>
                <input
                  className="auth-input"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoComplete="email"
                />

                <div className="auth-inline-actions">
                  <button type="button" className="secondary" onClick={requestPasswordReset} disabled={forgotLoading}>
                    {forgotLoading ? 'Sending...' : forgotCodeRequested ? 'Resend code' : 'Send reset code'}
                  </button>
                </div>

                {forgotCodeRequested && (
                  <>
                    <label className="auth-label">Reset code</label>
                    <input
                      className="auth-input"
                      placeholder="6-digit code"
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value)}
                      autoComplete="one-time-code"
                    />

                    <div className="auth-field-grid">
                      <div className="auth-field-block">
                        <label className="auth-label">New password</label>
                        <input
                          className="auth-input"
                          placeholder="Minimum 8 characters"
                          type="password"
                          value={forgotPassword}
                          onChange={(e) => setForgotPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="auth-field-block">
                        <label className="auth-label">Confirm new password</label>
                        <input
                          className="auth-input"
                          placeholder="Confirm new password"
                          type="password"
                          value={forgotConfirm}
                          onChange={(e) => setForgotConfirm(e.target.value)}
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </>
                )}

                {forgotInfo && <div className="text-success auth-inline-message">{forgotInfo}</div>}
                {forgotError && <div className="text-danger auth-inline-message">{forgotError}</div>}

                {forgotCodeRequested && (
                  <div className="auth-inline-actions">
                    <button type="button" className="primary" onClick={completePasswordReset} disabled={forgotLoading}>
                      {forgotLoading ? 'Resetting...' : 'Reset password'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!showForgotPassword && (
              <div className="auth-actions">
                <button type="submit" className="primary" disabled={loading || !!emailError}>{loading? 'Logging in...':'Log in'}</button>
              </div>
            )}
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
