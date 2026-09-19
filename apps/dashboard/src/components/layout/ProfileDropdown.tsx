import React, { useState, useRef, useEffect } from 'react';
import { useAdminStore } from '../../store/AdminStore';
import { User, LogOut, ShieldCheck, ChevronDown, KeyRound, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';

export const ProfileDropdown: React.FC = () => {
  const { currentUser, updateUserProfile, logout } = useAdminStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Form states
  const nameParts = currentUser.name ? currentUser.name.split(' ') : ['Admin', ''];
  const [firstName, setFirstName] = useState(currentUser.firstName || nameParts[0] || 'Admin');
  const [lastName, setLastName] = useState(currentUser.lastName || nameParts.slice(1).join(' ') || '');

  // Password toggle states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenManageModal = () => {
    setIsOpen(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    const parts = currentUser.name ? currentUser.name.split(' ') : ['Admin', ''];
    const fn = currentUser.firstName || parts[0] || 'Admin';
    const ln = currentUser.lastName || parts.slice(1).join(' ') || '';

    setFirstName(fn);
    setLastName(ln);
    setShowPasswordSection(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setIsManageModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (showPasswordSection && newPassword) {
      if (!oldPassword) {
        setErrorMsg('Please enter your current password.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirmation password do not match.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
    }

    setIsSubmitting(true);

    const res = await updateUserProfile({
      firstName: firstName.trim() || 'Admin',
      lastName: lastName.trim(),
      email: currentUser.email,
      ...(showPasswordSection && newPassword ? { oldPassword, newPassword } : {}),
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Account details saved directly to Cloudflare D1!');
      setTimeout(() => {
        setIsManageModalOpen(false);
        window.location.href = '/';
      }, 1000);
    } else {
      setErrorMsg(res.error || 'Failed to update profile.');
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    if (confirm('Are you sure you want to log out of ASTU Express Admin?')) {
      await logout();
      window.location.href = '/auth';
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.45rem 0.75rem',
          borderRadius: '0.375rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <div
          style={{
            width: '1.875rem',
            height: '1.875rem',
            borderRadius: '50%',
            backgroundColor: '#0ea5e9',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.75rem',
          }}
        >
          {(currentUser.firstName || currentUser.name).charAt(0).toUpperCase()}
        </div>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.15 }}>
            {currentUser.name}
          </span>
          <span style={{ fontSize: '0.625rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>
            {currentUser.role}
          </span>
        </div>
        <ChevronDown size={14} color="#64748b" />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '0.375rem',
            width: '220px',
            backgroundColor: '#ffffff',
            borderRadius: '0.375rem',
            border: '1px solid #e8e2d8',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
            zIndex: 40,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid #e8e2d8', backgroundColor: '#fcfbf9' }}>
            <p style={{ margin: 0, fontSize: '0.78125rem', fontWeight: 700, color: '#211a13' }}>
              {currentUser.name}
            </p>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.725rem', color: '#8a7a6a' }}>{currentUser.email}</p>
          </div>
          <div style={{ padding: '0.25rem' }}>
            <button
              onClick={handleOpenManageModal}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.625rem',
                fontSize: '0.78125rem',
                fontWeight: 600,
                color: '#211a13',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <User size={14} color="#0ea5e9" /> Manage Account
            </button>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.625rem',
                fontSize: '0.78125rem',
                fontWeight: 600,
                color: '#dc2626',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Manage Account Modal */}
      <Modal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} title="Manage Main Admin Account">
        <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.78125rem',
              }}
            >
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.78125rem',
              }}
            >
              <Check size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* First & Last Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Email Address (Read-Only System Email) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
              Primary Account Email
            </label>
            <input
              type="email"
              disabled
              value={currentUser.email}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                borderRadius: '0.375rem',
                border: '1px solid #e8e2d8',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                fontSize: '0.8125rem',
                cursor: 'not-allowed',
              }}
            />
            <span style={{ fontSize: '0.6875rem', color: '#8a7a6a', marginTop: '0.15rem', display: 'block' }}>
              System account login email. Contact atelier admin to modify primary address.
            </span>
          </div>

          {/* Role & Permissions Read-Only Badge */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
              Account Role
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.65rem', backgroundColor: '#f0f9ff', borderRadius: '0.375rem', border: '1px solid #bae6fd' }}>
              <ShieldCheck size={16} color="#0ea5e9" />
              <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: '#0284c7' }}>{currentUser.role} (Main Executive)</span>
            </div>
          </div>

          {/* Change Password Toggle */}
          <div style={{ borderTop: '1px solid #e8e2d8', paddingTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: showPasswordSection ? '#f0f9ff' : 'transparent',
                border: '1px solid #e8e2d8',
                padding: '0.45rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.78125rem',
                fontWeight: 700,
                color: '#0284c7',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <KeyRound size={15} /> Change Password
              </span>
              <span>{showPasswordSection ? '▲ Cancel' : '▼ Expand'}</span>
            </button>

            {showPasswordSection && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fcfbf9', borderRadius: '0.375rem', border: '1px solid #e8e2d8' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#211a13', marginBottom: '0.2rem' }}>
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.78125rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#211a13', marginBottom: '0.2rem' }}>
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.78125rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 700, color: '#211a13', marginBottom: '0.2rem' }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', fontSize: '0.78125rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '0.5rem',
              backgroundColor: isSubmitting ? '#94a3b8' : '#0ea5e9',
              color: '#ffffff',
              padding: '0.55rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
            }}
          >
            {isSubmitting ? 'Saving to Cloudflare D1...' : 'Save Account Changes'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

