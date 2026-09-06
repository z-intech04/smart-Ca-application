import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import './Auth.css';

function Register({ onLogin }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await register(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please verify your details.');
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
          <p className="auth-tagline">Create your Chartered Accountant Practice Account</p>
        </div>

        {/* Tab / Title Indicator */}
        <div className="auth-nav-pills">
          <Link to="/login" className="auth-nav-pill">Sign In</Link>
          <span className="auth-nav-pill active">Register</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-alert" role="alert">
            <AlertCircle size={18} className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="auth-form-modern">
          <div className="auth-input-group">
            <label htmlFor="reg-name">Practitioner / Firm Name</label>
            <div className="auth-input-wrap">
              <User size={18} className="auth-input-icon" />
              <input
                id="reg-name"
                type="text"
                placeholder="CA R. K. Sharma & Associates"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="reg-email">Official Email Address</label>
            <div className="auth-input-wrap">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="reg-email"
                type="email"
                placeholder="firm@practice.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="reg-password">Secure Password</label>
            <div className="auth-input-wrap">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength="6"
                autoComplete="new-password"
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
            <span className="auth-field-hint">Must be at least 6 characters</span>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loading-state">
                <span className="btn-spinner"></span>
                <span>Creating Account...</span>
              </span>
            ) : (
              <span className="btn-content-state">
                <span>Create Practice Account</span>
                <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-footer-modern">
          <p className="auth-switch-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-accent-link">
              Sign in here
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

export default Register;
