import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, getAllDocuments } from '../api';
import {
  Users,
  FileText,
  UserPlus,
  UploadCloud,
  ArrowUpRight,
  ShieldCheck,
  FolderOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck
} from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({ clients: 0, documents: 0 });
  const [recentClients, setRecentClients] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [clientsRes, docsRes] = await Promise.all([
        getClients(),
        getAllDocuments()
      ]);
      const clientsList = clientsRes.data?.clients || [];
      const docsList = docsRes.data?.documents || [];

      setStats({
        clients: clientsList.length,
        documents: docsList.length
      });

      // Show the most recent 4 clients and documents
      setRecentClients([...clientsList].reverse().slice(0, 4));
      setRecentDocs([...docsList].reverse().slice(0, 4));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="dashboard-container">
      {/* Welcome Hero Banner - Rounded with smooth gradient and subtle shadow */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            <span>CA Practice Portal</span>
          </div>
          <h1>Welcome back, {user.name || 'Practitioner'}</h1>
          <p>Effortlessly organize clients, automate document dispatch, and ensure tax compliance.</p>
        </div>
        <div className="hero-meta">
          <div className="date-pill">
            <Calendar size={16} />
            <span>{currentDate}</span>
          </div>
          <div className="status-pill">
            <CheckCircle2 size={16} />
            <span>WhatsApp Gateway Ready</span>
          </div>
        </div>
      </div>

      {/* Stats Metric Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/clients')}>
          <div className="stat-icon-wrap stat-icon-indigo">
            <Users size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Clients</span>
            <div className="stat-value-row">
              <h3>{loading ? '—' : stats.clients}</h3>
              <span className="stat-subtext">Registered</span>
            </div>
            <span className="stat-action-link">View clients <ArrowUpRight size={14} /></span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/clients')}>
          <div className="stat-icon-wrap stat-icon-emerald">
            <FileText size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Documents</span>
            <div className="stat-value-row">
              <h3>{loading ? '—' : stats.documents}</h3>
              <span className="stat-subtext">Stored & verified</span>
            </div>
            <span className="stat-action-link">Inspect files <ArrowUpRight size={14} /></span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/upload-document')}>
          <div className="stat-icon-wrap stat-icon-amber">
            <FolderOpen size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Document Types</span>
            <div className="stat-value-row">
              <h3>6 Types</h3>
              <span className="stat-subtext">Supported</span>
            </div>
            <span className="stat-action-link">ITR, GST, TDS, Audit</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-violet">
            <ShieldCheck size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Automated Delivery</span>
            <div className="stat-value-row">
              <h3>Active</h3>
              <span className="stat-subtext">Encrypted</span>
            </div>
            <span className="stat-action-link">Direct WhatsApp Alerts</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="section-title-wrap">
        <h2>Quick Actions</h2>
        <span className="section-sub">Immediate workflows to manage client records and tax files</span>
      </div>

      <div className="action-grid">
        <div className="action-card" onClick={() => navigate('/add-client')}>
          <div className="action-top">
            <div className="action-icon-pill icon-indigo">
              <UserPlus size={24} />
            </div>
            <span className="action-arrow">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <h3>Add New Client</h3>
          <p>Register client records with WhatsApp number for automatic document sharing.</p>
          <div className="action-footer">
            <span className="action-tag">Register Client →</span>
          </div>
        </div>

        <div className="action-card" onClick={() => navigate('/upload-document')}>
          <div className="action-top">
            <div className="action-icon-pill icon-emerald">
              <UploadCloud size={24} />
            </div>
            <span className="action-arrow">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <h3>Upload Document</h3>
          <p>Upload ITR acknowledgements, GST returns, TDS certificates, and audit reports.</p>
          <div className="action-footer">
            <span className="action-tag">Upload Document →</span>
          </div>
        </div>

        <div className="action-card" onClick={() => navigate('/clients')}>
          <div className="action-top">
            <div className="action-icon-pill icon-blue">
              <Users size={24} />
            </div>
            <span className="action-arrow">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <h3>Client Directory</h3>
          <p>Browse client profiles, search by WhatsApp number, and view categorized filings.</p>
          <div className="action-footer">
            <span className="action-tag">Browse Directory →</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Sections */}
      <div className="recent-activity-grid">
        {/* Recent Clients Card */}
        <div className="activity-card">
          <div className="activity-card-header">
            <div className="activity-header-info">
              <div className="activity-icon-mini icon-indigo">
                <Users size={18} />
              </div>
              <div>
                <h3>Recent Clients</h3>
                <span className="activity-subtitle">Latest enrolled client profiles</span>
              </div>
            </div>
            <button
              type="button"
              className="activity-view-all"
              onClick={() => navigate('/clients')}
            >
              View All
            </button>
          </div>

          <div className="activity-list">
            {loading ? (
              <div className="activity-empty">Loading clients...</div>
            ) : recentClients.length > 0 ? (
              recentClients.map((client) => (
                <div
                  key={client._id}
                  className="client-list-item"
                  onClick={() => navigate(`/client/${client._id}`)}
                >
                  <div className="client-avatar">
                    {client.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div className="client-meta">
                    <span className="client-name">{client.name}</span>
                    <span className="client-phone">📱 {client.whatsappNumber}</span>
                  </div>
                  <div className="client-item-end">
                    {client.clientType && (
                      <span className="client-pill">{client.clientType}</span>
                    )}
                    <span className="arrow-ghost"><ArrowUpRight size={16} /></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="activity-empty">
                <p>No clients registered yet</p>
                <button
                  type="button"
                  className="empty-btn"
                  onClick={() => navigate('/add-client')}
                >
                  Add Your First Client
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents Card */}
        <div className="activity-card">
          <div className="activity-card-header">
            <div className="activity-header-info">
              <div className="activity-icon-mini icon-emerald">
                <FileCheck size={18} />
              </div>
              <div>
                <h3>Recent Documents</h3>
                <span className="activity-subtitle">Latest files uploaded & categorized</span>
              </div>
            </div>
            <button
              type="button"
              className="activity-view-all"
              onClick={() => navigate('/clients')}
            >
              View All
            </button>
          </div>

          <div className="activity-list">
            {loading ? (
              <div className="activity-empty">Loading documents...</div>
            ) : recentDocs.length > 0 ? (
              recentDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="doc-list-item"
                  onClick={() => {
                    if (doc.clientId?._id || doc.clientId) {
                      navigate(`/client/${doc.clientId?._id || doc.clientId}`);
                    }
                  }}
                >
                  <div className="doc-badge-pill">
                    {doc.documentType || 'DOC'}
                  </div>
                  <div className="doc-meta">
                    <span className="doc-name">{doc.documentName || doc.fileName || 'Tax Document'}</span>
                    <div className="doc-submeta">
                      {doc.financialYear && <span className="doc-fy">FY {doc.financialYear}</span>}
                      {doc.createdAt && (
                        <span className="doc-time">
                          <Clock size={12} /> {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="doc-item-end">
                    <span className="arrow-ghost"><ArrowUpRight size={16} /></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="activity-empty">
                <p>No documents uploaded yet</p>
                <button
                  type="button"
                  className="empty-btn"
                  onClick={() => navigate('/upload-document')}
                >
                  Upload Your First File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
