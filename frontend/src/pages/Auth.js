import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, AlertCircle, Truck, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const ROLE_CONFIG = {
  user:   { label: 'Passenger', icon: User,     color: '#3B82F6', bg: '#EFF6FF' },
  driver: { label: 'Driver',    icon: Truck,    color: '#10B981', bg: '#ECFDF5' },
  admin:  { label: 'Admin',     icon: Settings, color: '#F59E0B', bg: '#FFFBEB' },
};

const Auth = ({ mode: initialMode, roleHint = 'user', onClose }) => {
  const [mode, setMode] = useState(initialMode || 'login');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    role: roleHint === 'admin' ? 'user' : roleHint  // admin is seeded only
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const cfg = ROLE_CONFIG[roleHint] || ROLE_CONFIG.user;
  const RoleIcon = cfg.icon;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login({ email: formData.email, password: formData.password });
        if (result.success) {
          onClose();
        } else {
          setError(result.message);
        }
      } else {
        if (!formData.name || !formData.email || !formData.password) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const result = await register(formData);
        if (result.success) {
          onClose();
        } else {
          setError(result.message);
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({ name: '', email: '', password: '', phone: '', role: formData.role });
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}><X size={24} /></button>

        <div className="auth-content">
          {/* Role badge at top */}
          <div className="auth-role-badge" style={{ background: cfg.bg, color: cfg.color }}>
            <RoleIcon size={18} />
            <span>{cfg.label} {mode === 'login' ? 'Login' : 'Registration'}</span>
          </div>

          <div className="auth-header">
            <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p>
              {mode === 'login'
                ? `Sign in as ${cfg.label.toLowerCase()} to continue`
                : `Register as a ${cfg.label.toLowerCase()}`}
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label>Full Name *</label>
                <div className="input-wrapper">
                  <User size={20} className="input-icon" />
                  <input type="text" name="name" value={formData.name}
                    onChange={handleChange} placeholder="Enter your name" required className="input" />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Email *</label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="your.email@example.com" required className="input" />
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Phone</label>
                <div className="input-wrapper">
                  <Phone size={20} className="input-icon" />
                  <input type="tel" name="phone" value={formData.phone}
                    onChange={handleChange} placeholder="98xxxxxxxx" className="input" />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Password *</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input type="password" name="password" value={formData.password}
                  onChange={handleChange} placeholder="••••••••" required className="input" />
              </div>
              {mode === 'register' && <span className="form-hint">Minimum 6 characters</span>}
            </div>

            <button type="submit" className="btn-primary btn-full"
              style={{ background: cfg.color }} disabled={loading}>
              {loading ? 'Processing...' : (mode === 'login' ? `Sign In as ${cfg.label}` : 'Create Account')}
            </button>
          </form>

          {/* Only passengers can self-register; drivers & admins are seeded */}
          {roleHint === 'user' && (
            <div className="auth-footer">
              <p>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button className="auth-switch" onClick={switchMode}>
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          )}

          {mode === 'login' && (
            <div className="demo-credentials">
              <p className="demo-title">Demo:</p>
              {roleHint === 'admin'  && <p className="demo-text">admin@busyatra.com / admin123</p>}
              {roleHint === 'driver' && <p className="demo-text">driver1@busyatra.com / driver123</p>}
              {roleHint === 'user'   && <p className="demo-text">Register a new account above</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
