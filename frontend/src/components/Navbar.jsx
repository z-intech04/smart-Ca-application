import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  Users,
  UserPlus,
  UploadCloud,
  ShieldCheck
} from 'lucide-react';
import './Navbar.css';

function Navbar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    onLogout();
    navigate('/login');
  };

  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar-modern">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand">
          <Link to="/dashboard" onClick={closeMenu} className="brand-link">
            <div className="brand-icon-wrap">
              <ShieldCheck size={20} />
            </div>
            <span className="brand-title">CA Document System</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="navbar-mobile-toggle"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Desktop & Mobile Links */}
        <div className={`navbar-links-container ${isMenuOpen ? 'menu-open' : ''}`}>
          <div className="nav-routes-list">
            <Link
              to="/dashboard"
              onClick={closeMenu}
              className={`nav-route-item ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/clients"
              onClick={closeMenu}
              className={`nav-route-item ${isActive('/clients') ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>Clients</span>
            </Link>

            <Link
              to="/add-client"
              onClick={closeMenu}
              className={`nav-route-item ${isActive('/add-client') ? 'active' : ''}`}
            >
              <UserPlus size={18} />
              <span>Add Client</span>
            </Link>

            <Link
              to="/upload-document"
              onClick={closeMenu}
              className={`nav-route-item ${isActive('/upload-document') ? 'active' : ''}`}
            >
              <UploadCloud size={18} />
              <span>Upload File</span>
            </Link>
          </div>

          <div className="nav-user-controls">
            <div className="user-profile-badge">
              <div className="user-avatar-dot">
                <User size={14} />
              </div>
              <span className="user-display-name">{user.name || 'Practitioner'}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="navbar-logout-btn"
              title="Logout from practice"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
