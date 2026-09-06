import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addClient } from '../api';
import {
  User,
  Building2,
  Users,
  Store,
  Landmark,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Send,
  Headphones
} from 'lucide-react';
import './AddClient.css';

const CLIENT_TYPES = [
  {
    value: 'INDIVIDUAL',
    title: 'Individual',
    desc: 'Salaried, HUF, Freelancer',
    icon: User
  },
  {
    value: 'COMPANY',
    title: 'Company',
    desc: 'Pvt Ltd, Public Ltd, OPC',
    icon: Building2
  },
  {
    value: 'PARTNERSHIP_LLP',
    title: 'Partnership / LLP',
    desc: 'Registered Firm, LLP',
    icon: Users
  },
  {
    value: 'PROPRIETORSHIP',
    title: 'Proprietorship',
    desc: 'Sole Trader, Retail, SME',
    icon: Store
  },
  {
    value: 'TRUST_NGO',
    title: 'Trust / NGO',
    desc: 'Societies, Section 8, Trust',
    icon: Landmark
  }
];

function AddClient() {
  const [formData, setFormData] = useState({
    name: '',
    whatsappNumber: '',
    consultantPhone: '',
    clientType: 'INDIVIDUAL'
  });
  const [countryCode, setCountryCode] = useState('+91');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Helper to format WhatsApp number into E.164 format (+91XXXXXXXXXX)
  const formatPhoneNumber = (num, code) => {
    let raw = num.replace(/[^\d]/g, ''); // strip all non-digits
    raw = raw.replace(/^0+/, ''); // remove any leading zeros
    if (!raw) return '';
    return `${code}${raw}`;
  };

  const handlePhoneChange = (e) => {
    // Keep only numbers and plus
    const val = e.target.value.replace(/[^\d]/g, '');
    setFormData({ ...formData, whatsappNumber: val });
  };

  const isPhoneValid = formData.whatsappNumber.length === 10 || formData.whatsappNumber.length >= 7;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Clean and format WhatsApp number
    const finalWhatsApp = formatPhoneNumber(formData.whatsappNumber, countryCode);
    if (!finalWhatsApp || finalWhatsApp.length < 8) {
      setError('Please enter a valid WhatsApp mobile number with at least 10 digits.');
      return;
    }

    let finalConsultant = formData.consultantPhone.trim();
    if (finalConsultant && !finalConsultant.startsWith('+')) {
      finalConsultant = formatPhoneNumber(finalConsultant, countryCode);
    }

    setLoading(true);
    try {
      await addClient({
        ...formData,
        whatsappNumber: finalWhatsApp,
        consultantPhone: finalConsultant
      });
      setSuccess(`Client "${formData.name}" registered successfully! Redirecting to directory...`);
      setTimeout(() => navigate('/clients'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register client. Please check details and retry.');
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeObj = CLIENT_TYPES.find(ct => ct.value === formData.clientType) || CLIENT_TYPES[0];

  return (
    <div className="add-client-container">
      {/* Back to Directory Link */}
      <div className="add-client-back-nav">
        <Link to="/clients" className="back-to-clients-btn">
          <ArrowLeft size={16} />
          <span>Back to Client Directory</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="add-client-header">
        <div className="onboarding-badge">
          <Sparkles size={14} />
          <span>Client Onboarding</span>
        </div>
        <h1>Register New Client</h1>
        <p className="add-client-subtitle">
          Add an individual or business client to automate tax and compliance document dispatch via WhatsApp.
        </p>
      </div>

      <div className="add-client-layout">
        {/* Main Form Card */}
        <div className="add-client-form-card">
          {error && (
            <div className="client-alert client-alert-error" role="alert">
              <AlertCircle size={20} className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="client-alert client-alert-success" role="alert">
              <CheckCircle2 size={20} className="alert-icon" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Client Type Selection Tiles */}
            <div className="form-section-block">
              <div className="form-label-row">
                <span className="form-section-label">
                  <Building2 size={16} />
                  <span>1. Select Entity Type</span>
                </span>
              </div>

              <div className="client-type-tiles-grid">
                {CLIENT_TYPES.map((ct) => {
                  const IconComp = ct.icon;
                  const isSelected = formData.clientType === ct.value;
                  return (
                    <label
                      key={ct.value}
                      className={`client-type-tile ${isSelected ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="clientType"
                        value={ct.value}
                        checked={isSelected}
                        onChange={() => setFormData({ ...formData, clientType: ct.value })}
                      />
                      <div className="tile-icon-box">
                        <IconComp size={20} />
                      </div>
                      <span className="tile-title">{ct.title}</span>
                      <span className="tile-desc">{ct.desc}</span>
                      {isSelected && (
                        <CheckCircle2 size={16} className="tile-check-dot" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Client Name */}
            <div className="form-section-block">
              <div className="form-label-row">
                <label htmlFor="client-name-input" className="form-section-label">
                  <User size={16} />
                  <span>2. Client or Organization Name</span>
                </label>
              </div>

              <div className="modern-input-wrap">
                <User size={18} className="modern-input-icon" />
                <input
                  id="client-name-input"
                  type="text"
                  className="modern-input-field"
                  placeholder="e.g. Ramesh Kumar Verma or Apex Global Pvt Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Step 3: WhatsApp Number */}
            <div className="form-section-block">
              <div className="form-label-row">
                <label htmlFor="client-whatsapp-input" className="form-section-label">
                  <MessageCircle size={16} />
                  <span>3. Client WhatsApp Number</span>
                </label>
              </div>

              <div className="phone-composite-wrap">
                <div className="country-code-pill">
                  <span>🇮🇳</span>
                  <span>{countryCode}</span>
                </div>

                <div className="modern-input-wrap">
                  <Phone size={18} className="modern-input-icon" />
                  <input
                    id="client-whatsapp-input"
                    type="tel"
                    className="modern-input-field"
                    placeholder="9876543210"
                    value={formData.whatsappNumber}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    required
                  />
                  {formData.whatsappNumber.length === 10 && (
                    <span className="phone-validation-badge">
                      <CheckCircle2 size={13} />
                      <span>Valid</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="input-helper-box">
                <MessageCircle size={15} className="input-helper-icon" />
                <span>
                  All filed ITR returns, GST computations, and audit certificates will be automatically dispatched to this WhatsApp number.
                </span>
              </div>
            </div>

            {/* Step 4: Consultant Phone (Optional) */}
            <div className="form-section-block">
              <div className="form-label-row">
                <label htmlFor="consultant-phone-input" className="form-section-label">
                  <Headphones size={16} />
                  <span>4. CA Support / Consultant Helpline</span>
                </label>
                <span className="form-optional-tag">Optional</span>
              </div>

              <div className="modern-input-wrap">
                <Headphones size={18} className="modern-input-icon" />
                <input
                  id="consultant-phone-input"
                  type="tel"
                  className="modern-input-field"
                  placeholder="e.g. +91 98123 45678"
                  value={formData.consultantPhone}
                  onChange={(e) => setFormData({ ...formData, consultantPhone: e.target.value })}
                />
              </div>
              <div className="input-helper-box">
                <HelpCircle size={15} className="input-helper-icon" style={{ color: '#94a3b8' }} />
                <span>Contact number your client can reach for queries regarding their filings.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="add-client-actions">
              <button
                type="button"
                className="btn-cancel-client"
                onClick={() => navigate('/clients')}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-submit-client"
                disabled={loading || !formData.name || formData.whatsappNumber.length < 10}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Registering Client...</span>
                  </>
                ) : (
                  <>
                    <span>Register Client Profile</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Preview & Practice Tips */}
        <aside className="add-client-sidebar">
          {/* Live Preview Card */}
          <div className="live-preview-card">
            <div className="preview-card-header">
              <span className="preview-title-badge">
                <Sparkles size={14} />
                <span>Live Preview</span>
              </span>
              <span className="preview-live-tag">Interactive</span>
            </div>

            <div className="preview-avatar-row">
              <div className="preview-avatar">
                {formData.name?.trim() ? formData.name.trim().charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="preview-client-info">
                <h3>{formData.name?.trim() || 'Client Name'}</h3>
                <span className="preview-type-pill">{selectedTypeObj.title}</span>
              </div>
            </div>

            <div className="preview-details-list">
              <div className="preview-detail-row">
                <MessageCircle size={16} className="preview-detail-icon" />
                <span className="preview-detail-text">
                  {formData.whatsappNumber ? `${countryCode} ${formData.whatsappNumber}` : `${countryCode} ••••• •••••`}
                </span>
              </div>

              {formData.consultantPhone && (
                <div className="preview-detail-row">
                  <Headphones size={16} className="preview-detail-icon" style={{ color: '#4f46e5' }} />
                  <span className="preview-detail-text">Support: {formData.consultantPhone}</span>
                </div>
              )}
            </div>

            <div className="preview-status-box">
              <ShieldCheck size={18} />
              <span>Direct WhatsApp Dispatch Enabled</span>
            </div>
          </div>

          {/* Quick Guidance Tips */}
          <div className="ca-tips-card">
            <div className="tips-header">
              <HelpCircle size={16} />
              <span>CA Practice Tips</span>
            </div>
            <ul className="ca-tips-list">
              <li>Verify that the WhatsApp number has an active WhatsApp account.</li>
              <li>For companies, you can enter the authorized director or accounts manager's mobile number.</li>
              <li>Once registered, you can upload ITR, GST, and audit files with one click.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AddClient;
