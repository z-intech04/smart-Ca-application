import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck,
  Users,
  FileText,
  Plus,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  X,
  Search,
  RefreshCw,
  Lock,
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  UserPlus
} from 'lucide-react';
import './Admin.css';

const API = import.meta.env.VITE_API_URL || 'https://ca-backend-cqed.onrender.com/api';
const ADMIN_HEADERS = { 'x-admin-password': 'zintechca' };

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState({ text: '', type: 'info' });
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/users`, { headers: ADMIN_HEADERS });
      setUsers(res.data.users || []);
    } catch {
      setMsg({ text: 'Failed to load users from admin API', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchUsers();
  }, [authed, fetchUsers]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'zintechca') {
      setAuthed(true);
      setAuthError('');
    } else {
      setAuthError('Invalid admin password');
    }
  };

  const handleViewDetail = async (userId) => {
    setSelectedUser(userId);
    try {
      const res = await axios.get(`${API}/admin/users/${userId}`, { headers: ADMIN_HEADERS });
      setUserDetail(res.data);
    } catch {
      setMsg({ text: 'Failed to load user details', type: 'error' });
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete CA user "${userName}" and ALL their associated clients and documents? This action cannot be reversed.`)) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { headers: ADMIN_HEADERS });
      setMsg({ text: `User "${userName}" was successfully deleted`, type: 'success' });
      setSelectedUser(null);
      setUserDetail(null);
      fetchUsers();
    } catch {
      setMsg({ text: 'Failed to delete user', type: 'error' });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/users`, newUser, { headers: ADMIN_HEADERS });
      setMsg({ text: `User "${newUser.name}" created successfully`, type: 'success' });
      setNewUser({ name: '', email: '', password: '' });
      setShowCreate(false);
      fetchUsers();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Failed to create user', type: 'error' });
    }
  };

  // Filter users by search term
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute aggregate stats
  const totalClients = users.reduce((acc, u) => acc + (u.clientCount || 0), 0);
  const totalDocs = users.reduce((acc, u) => acc + (u.docCount || 0), 0);

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card-modern">
          <div className="admin-login-badge">
            <ShieldCheck size={32} />
          </div>
          <h1>Admin Control</h1>
          <p className="admin-login-sub">CA Document Automation Infrastructure</p>

          {authError && (
            <div className="admin-auth-error" role="alert">
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="admin-field-wrap">
              <Lock size={18} className="admin-field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter master admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
              />
              <button
                type="button"
                className="admin-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" className="admin-login-submit-btn">
              Access Admin Panel
            </button>
          </form>

          <div className="admin-back-portal">
            <Link to="/login" className="admin-portal-link">
              <ArrowLeft size={16} />
              <span>Back to Practitioner Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main admin panel ──────────────────────────────────────────────────────
  return (
    <div className="admin-panel-container">
      {/* Top Navbar */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <div className="admin-topbar-logo">
            <ShieldCheck size={24} />
            <span>Admin Center</span>
          </div>
          <span className="admin-env-pill">Management</span>
        </div>

        <div className="admin-topbar-actions">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={fetchUsers}
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? 'icon-spin' : ''} />
            <span className="btn-text-desktop">Refresh</span>
          </button>

          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => setShowCreate(!showCreate)}
          >
            <Plus size={18} />
            <span>{showCreate ? 'Close' : 'New User'}</span>
          </button>

          <button
            type="button"
            className="admin-btn-logout"
            onClick={() => setAuthed(false)}
          >
            <LogOut size={16} />
            <span className="btn-text-desktop">Exit</span>
          </button>
        </div>
      </header>

      {/* Admin Content Canvas */}
      <main className="admin-canvas">
        {/* Toast / Notification Banner */}
        {msg.text && (
          <div className={`admin-notification-toast ${msg.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <div className="toast-left">
              {msg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{msg.text}</span>
            </div>
            <button type="button" className="toast-close" onClick={() => setMsg({ text: '', type: 'info' })}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Aggregate Overview Metrics */}
        <div className="admin-metrics-row">
          <div className="admin-metric-card">
            <div className="admin-metric-icon icon-indigo">
              <Users size={22} />
            </div>
            <div className="admin-metric-data">
              <span className="admin-metric-label">CA Accounts</span>
              <h3>{users.length}</h3>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="admin-metric-icon icon-emerald">
              <Building size={22} />
            </div>
            <div className="admin-metric-data">
              <span className="admin-metric-label">Managed Clients</span>
              <h3>{totalClients}</h3>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="admin-metric-icon icon-amber">
              <FileText size={22} />
            </div>
            <div className="admin-metric-data">
              <span className="admin-metric-label">Total Documents</span>
              <h3>{totalDocs}</h3>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="admin-metric-icon icon-violet">
              <CheckCircle2 size={22} />
            </div>
            <div className="admin-metric-data">
              <span className="admin-metric-label">System Gateway</span>
              <h3 className="status-online-text">Active</h3>
            </div>
          </div>
        </div>

        {/* Create User Accordion Card */}
        {showCreate && (
          <div className="admin-create-card">
            <div className="admin-create-header">
              <div className="create-title-wrap">
                <UserPlus size={20} className="create-icon" />
                <h3>Create New CA User Account</h3>
              </div>
              <button
                type="button"
                className="btn-icon-close"
                onClick={() => setShowCreate(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="admin-create-form">
              <div className="create-form-grid">
                <div className="admin-field-block">
                  <label>Full Practitioner / Firm Name</label>
                  <input
                    placeholder="e.g. CA S. N. Gupta"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-field-block">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="ca.gupta@practice.com"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-field-block">
                  <label>Initial Password</label>
                  <input
                    type="password"
                    placeholder="Set account password"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength="6"
                  />
                </div>
              </div>

              <div className="create-form-actions">
                <button type="submit" className="admin-btn-primary">
                  Create Account
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Grid: Users List + Detail Drawer */}
        <div className={`admin-content-layout ${userDetail ? 'with-detail-open' : ''}`}>
          {/* Users Card Section */}
          <div className="admin-panel-card">
            <div className="panel-card-header">
              <div>
                <h2>Registered CA Accounts ({filteredUsers.length})</h2>
                <span className="panel-card-sub">Active practitioner instances</span>
              </div>

              {/* Search Bar */}
              <div className="admin-search-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search user or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button type="button" className="search-clear" onClick={() => setSearchTerm('')}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="admin-loading-state">
                <RefreshCw size={24} className="icon-spin" />
                <span>Loading CA accounts...</span>
              </div>
            ) : filteredUsers.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="admin-table-responsive">
                  <table className="admin-modern-table">
                    <thead>
                      <tr>
                        <th>Practitioner</th>
                        <th>Email</th>
                        <th>Clients</th>
                        <th>Documents</th>
                        <th>Joined</th>
                        <th className="th-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr
                          key={u._id}
                          className={selectedUser === u._id ? 'row-selected' : ''}
                        >
                          <td>
                            <div className="table-user-cell">
                              <div className="table-user-avatar">
                                {u.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <span className="table-user-name">{u.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="table-email">{u.email}</span>
                          </td>
                          <td>
                            <span className="pill-badge pill-blue">{u.clientCount || 0} clients</span>
                          </td>
                          <td>
                            <span className="pill-badge pill-green">{u.docCount || 0} docs</span>
                          </td>
                          <td>
                            <span className="table-date">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                            </span>
                          </td>
                          <td className="td-actions">
                            <div className="row-action-btns">
                              <button
                                type="button"
                                className="action-btn-view"
                                onClick={() => handleViewDetail(u._id)}
                                title="View details"
                              >
                                <Eye size={15} />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                className="action-btn-del"
                                onClick={() => handleDelete(u._id, u.name)}
                                title="Delete account"
                              >
                                <Trash2 size={15} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="admin-cards-mobile">
                  {filteredUsers.map(u => (
                    <div
                      key={u._id}
                      className={`admin-user-card-mobile ${selectedUser === u._id ? 'mobile-card-selected' : ''}`}
                    >
                      <div className="mobile-card-top">
                        <div className="table-user-avatar">
                          {u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="mobile-user-details">
                          <h4>{u.name}</h4>
                          <span className="mobile-user-email">{u.email}</span>
                        </div>
                      </div>

                      <div className="mobile-card-stats">
                        <span className="pill-badge pill-blue">{u.clientCount || 0} clients</span>
                        <span className="pill-badge pill-green">{u.docCount || 0} docs</span>
                        <span className="mobile-join-date">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>

                      <div className="mobile-card-actions">
                        <button
                          type="button"
                          className="action-btn-view"
                          onClick={() => handleViewDetail(u._id)}
                        >
                          <Eye size={16} />
                          <span>View Details</span>
                        </button>
                        <button
                          type="button"
                          className="action-btn-del"
                          onClick={() => handleDelete(u._id, u.name)}
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="admin-empty-state">
                <Users size={36} className="empty-icon" />
                <p>No CA accounts match your search query</p>
                {searchTerm && (
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Detail Drawer / Modal Panel */}
          {userDetail && (
            <div className="admin-detail-panel">
              <div className="detail-panel-header">
                <div className="detail-user-intro">
                  <div className="detail-avatar">
                    {userDetail.user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3>{userDetail.user.name}</h3>
                    <span className="detail-email-sub">{userDetail.user.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-icon-close"
                  onClick={() => { setSelectedUser(null); setUserDetail(null); }}
                  aria-label="Close detail panel"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="detail-stats-cards">
                <div className="detail-stat-pill">
                  <Users size={18} className="detail-stat-icon icon-blue-text" />
                  <div>
                    <span className="detail-stat-num">{userDetail.clients?.length || 0}</span>
                    <span className="detail-stat-lbl">Clients</span>
                  </div>
                </div>
                <div className="detail-stat-pill">
                  <FileText size={18} className="detail-stat-icon icon-green-text" />
                  <div>
                    <span className="detail-stat-num">{userDetail.docCount || 0}</span>
                    <span className="detail-stat-lbl">Documents</span>
                  </div>
                </div>
              </div>

              <div className="detail-clients-section">
                <h4>Clients Registered ({userDetail.clients?.length || 0})</h4>
                {userDetail.clients?.length > 0 ? (
                  <div className="detail-clients-list">
                    {userDetail.clients.map(c => (
                      <div key={c._id} className="detail-client-item">
                        <div className="client-item-info">
                          <span className="detail-client-name">{c.name}</span>
                          <span className="detail-client-num">📱 {c.whatsappNumber}</span>
                        </div>
                        {c.clientType && (
                          <span className="detail-client-type">{c.clientType}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="detail-empty-clients">This user has not registered any clients yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Admin;
