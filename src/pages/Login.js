import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login, user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // If already logged in, show a way to logout or go to dashboard
  if (user) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-brand">
            <div className="login-logo-wrap"><div className="login-logo-ring"><span className="login-logo-icon">🛡</span></div></div>
            <div className="login-title">NammaRaksham</div>
          </div>
          <div className="login-card">
            <div className="login-section-label">{'// Already Authenticated'}</div>
            <p style={{ margin: '20px 0', color: 'var(--text-secondary)' }}>
              Logged in as <strong>{user.name}</strong> ({user.role})
            </p>
            <button className="btn btn-primary btn-full" onClick={() => navigate(user.role === 'admin' ? '/admin' : '/guard')}>
              Go to Dashboard
            </button>
            <button className="btn btn-outline btn-full" style={{ marginTop: 12 }} onClick={() => logout()}>
              Logout & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Enter email and password');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Access granted — ${user.name}`);
      navigate(user.role === 'admin' ? '/admin' : '/guard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@raksham.ai', password: 'admin123' });
    else setForm({ email: 'rajesh@guard.com', password: 'guard123' });
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-grid" />
        <div className="login-glow-1" />
        <div className="login-glow-2" />
        <div className="login-corner corner-tl" />
        <div className="login-corner corner-tr" />
        <div className="login-corner corner-bl" />
        <div className="login-corner corner-br" />
      </div>

      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo-wrap">
            <span className="login-logo-icon">🛡️</span>
          </div>
          <div className="login-title">NammaRaksham</div>
          <div className="login-subtitle">Secure Guard Tracking Enterprise</div>
        </div>

        <div className="login-card">
          <div className="login-section-label">{'// Authentication Required'}</div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Officer Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="officer@raksham.ai"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                autoCapitalize="none"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Access Code</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? (
                <><span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Authenticating...</>
              ) : '⟶  Authorize Access'}
            </button>
          </form>

          <div className="login-divider">
            <span>Quick Demo Access</span>
          </div>

          <div className="demo-btns">
            <button className="demo-btn" onClick={() => fillDemo('admin')}>
              <span className="demo-btn-icon">👑</span>
              <span>Admin</span>
              <span className="demo-btn-cred">admin@raksham.ai</span>
            </button>
            <button className="demo-btn" onClick={() => fillDemo('guard')}>
              <span className="demo-btn-icon">👮</span>
              <span>Guard</span>
              <span className="demo-btn-cred">rajesh@guard.com</span>
            </button>
          </div>
        </div>

        <div className="login-footer">
          <span>NammaRaksham</span> · v2.0 · raksham.ai
        </div>
      </div>
    </div>
  );
}
