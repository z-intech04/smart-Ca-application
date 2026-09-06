import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import './Auth.css';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-modern">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <ShieldCheck size={28} />
          </div>
          <h1>CA Document System</h1>
          <p className="auth-tagline">Chartered Accountant Practice & Document Hub</p>
        </div>

        {/* Tab / Title Indicator */}
        <div className="auth-nav-pills">
          <span className="auth-nav-pill active">Sign In</span>
          <Link to="/register" className="auth-nav-pill">Register</Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-alert" role="alert">
            <AlertCircle size={18} className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form-modern">
          <div className="auth-input-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="auth-input-wrap">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="name@practice.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loading-state">
                <span className="btn-spinner"></span>
                <span>Authenticating...</span>
              </span>
            ) : (
              <span className="btn-content-state">
                <span>Sign In to Practice</span>
                <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-footer-modern">
          <p className="auth-switch-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-accent-link">
              Register your practice
            </Link>
          </p>

          <div className="auth-admin-divider">
            <span>or</span>
          </div>

          <Link to="/admin" className="auth-admin-badge-btn">
            <ShieldCheck size={16} />
            <span>Admin Control Panel</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
