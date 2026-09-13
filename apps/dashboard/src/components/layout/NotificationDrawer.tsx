import React from 'react';
import { Drawer } from '../ui/Drawer';
import { useAdminStore } from '../../store/AdminStore';
import { Bell, Trash2, AlertTriangle, ShoppingBag, Info } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useAdminStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'inventory':
        return <AlertTriangle size={16} color="#d97706" />;
      case 'order':
        return <ShoppingBag size={16} color="#2563eb" />;
      default:
        return <Info size={16} color="#0ea5e9" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Atelier Notifications">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.625rem', borderBottom: '1px solid #e8e2d8' }}>
          <span style={{ fontSize: '0.8125rem', color: '#8a7a6a', fontWeight: 600 }}>
            {unreadCount > 0 ? `${unreadCount} Unread Notifications` : 'All caught up'}
          </span>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.725rem',
                color: '#dc2626',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              <Trash2 size={13} /> Clear All
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#8a7a6a' }}>
            <Bell size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem' }}>No notifications at this time.</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78125rem' }}>System and store alerts will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: n.read ? '#ffffff' : '#f0f9ff',
                  border: `1px solid ${n.read ? '#e8e2d8' : '#bae6fd'}`,
                  display: 'flex',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ paddingTop: '0.1rem' }}>{getIcon(n.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: '#211a13' }}>{n.title}</h4>
                    <span style={{ fontSize: '0.6875rem', color: '#8a7a6a' }}>{n.timestamp}</span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78125rem', color: '#524535', lineHeight: 1.35 }}>{n.message}</p>
                </div>
                {!n.read && (
                  <div style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', backgroundColor: '#0ea5e9', alignSelf: 'center' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
};
