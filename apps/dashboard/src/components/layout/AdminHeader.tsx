import React, { useState, useEffect } from 'react';
import { Search, Bell, Store, ChevronDown } from 'lucide-react';
import { useAdminStore } from '../../store/AdminStore';
import { NotificationDrawer } from './NotificationDrawer';
import { ProfileDropdown } from './ProfileDropdown';
import { StoreSelectorModal } from './StoreSelectorModal';
import { SpotlightModal } from '../spotlight/SpotlightModal';

export const AdminHeader: React.FC = () => {
  const { activeStore, notifications } = useAdminStore();

  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header
        style={{
          height: '68px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0.75rem',
          margin: 0,
          marginLeft: 0,
          marginRight: 0,
          position: 'sticky',
          top: 0,
          zIndex: 20,
          boxSizing: 'border-box',
        }}
      >
        {/* Left: Store Selector & Spotlight Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {/* Store Selector Trigger */}
          <button
            onClick={() => setIsStoreModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.55rem 0.95rem',
              borderRadius: '0.375rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#0f172a',
              transition: 'all 0.15s ease',
            }}
          >
            <Store size={18} color="#0ea5e9" />
            <span>{activeStore.name}</span>
            <ChevronDown size={15} color="#64748b" />
          </button>

          {/* Spotlight Palette Trigger */}
          <button
            onClick={() => setIsSpotlightOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.55rem 1rem',
              borderRadius: '0.375rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#64748b',
              minWidth: '300px',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={18} color="#0ea5e9" />
              <span>Search ASTU Express ERP & Shipping...</span>
            </div>
            <kbd
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '0.125rem 0.4rem',
                borderRadius: '0.25rem',
                color: '#475569',
                boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Notifications Bell & Profile Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {/* Notification Bell Button */}
          <button
            onClick={() => setIsNotificationDrawerOpen(true)}
            style={{
              position: 'relative',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0f172a',
              transition: 'all 0.15s ease',
            }}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: '#8b3224',
                  color: '#ffffff',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  width: '1.125rem',
                  height: '1.125rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown Component */}
          <ProfileDropdown />
        </div>
      </header>

      {/* Modals & Drawers */}
      <NotificationDrawer isOpen={isNotificationDrawerOpen} onClose={() => setIsNotificationDrawerOpen(false)} />
      <StoreSelectorModal isOpen={isStoreModalOpen} onClose={() => setIsStoreModalOpen(false)} />
      <SpotlightModal isOpen={isSpotlightOpen} onClose={() => setIsSpotlightOpen(false)} />
    </>
  );
};
