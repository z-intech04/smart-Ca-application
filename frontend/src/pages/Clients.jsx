import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  FileText,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Building2,
  Store,
  User,
  Landmark,
  X,
  MessageCircle,
  ExternalLink,
  FolderOpen
} from 'lucide-react';
import './Clients.css';

const CLIENT_TYPE_LABELS = {
  COMPANY: { label: 'Company', icon: Building2, color: 'pill-blue' },
  PARTNERSHIP_LLP: { label: 'Partnership / LLP', icon: Users, color: 'pill-indigo' },
  PROPRIETORSHIP: { label: 'Proprietorship', icon: Store, color: 'pill-amber' },
  INDIVIDUAL: { label: 'Individual', icon: User, color: 'pill-emerald' },
  TRUST_NGO: { label: 'Trust / NGO', icon: Landmark, color: 'pill-purple' }
};

function Clients() {
  const [clients, setClients] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data.documents || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchDocuments();
  }, [fetchClients, fetchDocuments]);

  const getClientDocuments = (clientId) => {
    let docs = documents.filter(doc => doc.clientId?._id === clientId || doc.clientId === clientId);
    if (filter !== 'ALL') {
      docs = docs.filter(doc => doc.documentType === filter);
    }
    return docs;
  };

  const handleClientClick = (clientId) => {
    navigate(`/client/${clientId}`);
  };

  const handleUploadForClient = (e, clientId) => {
    e.stopPropagation();
    navigate('/upload-document', { state: { clientId } });
  };

  const handleOpenWhatsApp = (e, phone) => {
    e.stopPropagation();
    const clean = phone.replace(/[^\d]/g, '');
    if (clean) {
      window.open(`https://wa.me/${clean}`, '_blank');
    }
  };

  // Filter clients by search term
  const filteredClients = clients.filter(client => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      client.name?.toLowerCase().includes(term) ||
      client.whatsappNumber?.includes(term);

    if (!matchesSearch) return false;

    if (filter !== 'ALL') {
      const clientDocs = documents.filter(
        doc => (doc.clientId?._id === client._id || doc.clientId === client._id) && doc.documentType === filter
      );
      return clientDocs.length > 0;
    }

    return true;
  });

  const documentTypes = ['ALL', 'ITR', 'GST', 'TDS', 'BALANCE SHEET', 'AUDIT REPORT'];

  if (loading) {
    return (
      <div className="clients-container">
        <div className="clients-loading-state">
          <div className="loading-spinner"></div>
          <p>Loading client records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clients-container">
      {/* Top Header Row with Actions */}
      <div className="clients-header-row">
        <div className="clients-header-intro">
          <div className="clients-badge-pill">
            <Users size={14} />
            <span>Practice Directory</span>
          </div>
          <h1>Client Management</h1>
          <p className="clients-header-sub">
            Manage your practice client profiles, compliance documents, and automated WhatsApp communication.
          </p>
        </div>

        <button
          type="button"
          className="btn-add-client-cta"
          onClick={() => navigate('/add-client')}
        >
          <UserPlus size={18} />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Quick Metrics Strip */}
      <div className="clients-metrics-strip">
        <div className="metric-strip-pill">
          <Users size={16} className="text-indigo" />
          <span><strong>{clients.length}</strong> Total Clients</span>
        </div>
        <div className="metric-strip-pill">
          <FileText size={16} className="text-emerald" />
          <span><strong>{documents.length}</strong> Total Documents</span>
        </div>
        <div className="metric-strip-pill">
          <FolderOpen size={16} className="text-amber" />
          <span><strong>{filteredClients.length}</strong> Matching Results</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="clients-toolbar-card">
        {/* Search Input */}
        <div className="clients-search-box">
          <Search size={18} className="search-icon-inside" />
          <input
            type="text"
            placeholder="Search by client name or WhatsApp number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="clients-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="clients-filter-scroll">
          <span className="filter-label-prefix">Filter Docs:</span>
          {documentTypes.map(type => {
            const count = type === 'ALL'
              ? documents.length
              : documents.filter(d => d.documentType === type).length;
            return (
              <button
                key={type}
                type="button"
                className={`filter-btn-pill ${filter === type ? 'active' : ''}`}
                onClick={() => setFilter(type)}
              >
                <span>{type}</span>
                <span className="filter-count-tag">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="clients-grid">
        {filteredClients.map(client => {
          const clientDocs = getClientDocuments(client._id);
          const typeMeta = CLIENT_TYPE_LABELS[client.clientType] || CLIENT_TYPE_LABELS.INDIVIDUAL;
          const TypeIcon = typeMeta.icon;
          const initial = client.name?.trim() ? client.name.trim().charAt(0).toUpperCase() : 'C';

          return (
            <div
              key={client._id}
              className="client-card-modern"
              onClick={() => handleClientClick(client._id)}
            >
              {/* Card Header */}
              <div className="client-card-top">
                <div className="client-avatar-badge">
                  {initial}
                </div>

                <div className="client-card-title-group">
                  <h3 title={client.name}>{client.name}</h3>
                  <div className={`client-entity-chip ${typeMeta.color}`}>
                    <TypeIcon size={12} />
                    <span>{typeMeta.label}</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp & Contact Bar */}
              <div className="client-contact-row">
                <div className="client-phone-info">
                  <Phone size={14} className="phone-icon" />
                  <span className="phone-text">{client.whatsappNumber}</span>
                </div>

                <button
                  type="button"
                  className="whatsapp-quick-btn"
                  title="Open WhatsApp Chat"
                  onClick={(e) => handleOpenWhatsApp(e, client.whatsappNumber)}
                >
                  <MessageCircle size={15} />
                  <span>Chat</span>
                </button>
              </div>

              {/* Documents Summary Section */}
              <div className="client-docs-preview-box">
                <div className="docs-summary-header">
                  <span className="docs-count-label">
                    <FileText size={14} />
                    <span>{clientDocs.length} {clientDocs.length === 1 ? 'Document' : 'Documents'}</span>
                  </span>
                  {filter !== 'ALL' && (
                    <span className="filter-matched-badge">Matching: {filter}</span>
                  )}
                </div>

                {clientDocs.length === 0 ? (
                  <div className="docs-empty-state">
                    <span>No documents filed yet</span>
                  </div>
                ) : (
                  <div className="doc-pills-wrap">
                    {[...new Set(clientDocs.map(d => d.documentType))].slice(0, 4).map(type => (
                      <span key={type} className="doc-type-pill">
                        {type}
                      </span>
                    ))}
                    {[...new Set(clientDocs.map(d => d.documentType))].length > 4 && (
                      <span className="doc-type-pill pill-more">
                        +{[...new Set(clientDocs.map(d => d.documentType))].length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="client-card-actions">
                <button
                  type="button"
                  className="btn-card-upload"
                  onClick={(e) => handleUploadForClient(e, client._id)}
                  title="Upload document for this client"
                >
                  <UploadCloud size={15} />
                  <span>Upload File</span>
                </button>

                <button
                  type="button"
                  className="btn-card-view"
                  onClick={() => handleClientClick(client._id)}
                >
                  <span>View Details</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="clients-empty-card">
          <div className="empty-icon-wrap">
            <Users size={36} />
          </div>
          <h2>No Clients Found</h2>
          <p>
            {searchTerm
              ? `No client profiles match your search "${searchTerm}".`
              : filter !== 'ALL'
              ? `No clients found with documents under category "${filter}".`
              : 'Your client directory is currently empty. Add your first client to start automating document sharing.'}
          </p>

          {searchTerm ? (
            <button
              type="button"
              className="btn-clear-search-cta"
              onClick={() => { setSearchTerm(''); setFilter('ALL'); }}
            >
              Reset Filters
            </button>
          ) : (
            <button
              type="button"
              className="btn-empty-add-cta"
              onClick={() => navigate('/add-client')}
            >
              <UserPlus size={18} />
              <span>Register First Client</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Clients;