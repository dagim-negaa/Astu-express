import { createFileRoute } from '@tanstack/react-router';
import React, { useState } from 'react';
import { useAdminStore, type StoreLocation } from '../../store/AdminStore';
import { Store, Plus, Bell, MapPin, Pencil, Trash2, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { CreateStoreSchema, UpdateStoreSchema, validateData } from '@astu/shared';

export const Route = createFileRoute('/admin/settings')({
  component: SettingsComponent,
});

const SETTINGS_EMAIL_ALERTS_KEY = 'r2_settings_email_alerts';
const SETTINGS_STOCK_ALERTS_KEY = 'r2_settings_stock_alerts';

function SettingsComponent() {
  const { activeStore, stores, setActiveStoreId, addStore, updateStore, deleteStore, currentUser } = useAdminStore();
  const isAdmin = currentUser.role?.toLowerCase() === 'admin' || currentUser.role?.toLowerCase() === 'owner';

  // State for Add Store form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // State for Editing Store
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Feedback Toast
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Alerts states
  const [emailAlerts, setEmailAlerts] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SETTINGS_EMAIL_ALERTS_KEY);
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const [stockAlerts, setStockAlerts] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SETTINGS_STOCK_ALERTS_KEY);
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const physicalStores = stores.filter((s) => s.id !== 'all');

  const startEditing = (s: StoreLocation) => {
    setEditingStoreId(s.id);
    setEditName(s.name);
    setEditLocation(s.location);
    setEditIsDefault(Boolean(s.isDefault));
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingStoreId(null);
    setEditName('');
    setEditLocation('');
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!isAdmin) return;

    const validation = validateData(UpdateStoreSchema, {
      name: editName.trim(),
      location: editLocation.trim(),
      isDefault: editIsDefault,
    });
    if (!validation.success) {
      setEditError(validation.error);
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    try {
      await updateStore(id, {
        name: editName.trim(),
        location: editLocation.trim(),
        isDefault: editIsDefault,
      });
      setFeedbackMsg({ text: `Successfully updated "${editName.trim()}"!`, type: 'success' });
      cancelEditing();
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update store branch.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const validation = validateData(CreateStoreSchema, {
      name: newName.trim(),
      location: newLocation.trim(),
    });
    if (!validation.success) {
      setAddError(validation.error);
      return;
    }

    setIsAdding(true);
    setAddError(null);
    try {
      await addStore(newName.trim(), newLocation.trim());
      setFeedbackMsg({ text: `Branch "${newName.trim()}" added to atelier catalog!`, type: 'success' });
      setNewName('');
      setNewLocation('');
      setIsAddOpen(false);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setAddError(err?.message || 'Failed to create store branch.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteStore = async (s: StoreLocation) => {
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to delete store location "${s.name}"?`)) {
      try {
        await deleteStore(s.id);
        setFeedbackMsg({ text: `Deleted "${s.name}"`, type: 'success' });
        setTimeout(() => setFeedbackMsg(null), 3000);
      } catch (err: any) {
        setFeedbackMsg({ text: err?.message || 'Failed to delete store', type: 'error' });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    }
  };

  const handleStockAlertsChange = (val: boolean) => {
    setStockAlerts(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_STOCK_ALERTS_KEY, String(val));
    }
  };

  const handleEmailAlertsChange = (val: boolean) => {
    setEmailAlerts(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_EMAIL_ALERTS_KEY, String(val));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '44px' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            fontFamily: 'EB Garamond, Georgia, serif',
            margin: 0,
            color: '#211a13',
            lineHeight: 1.2,
          }}
        >
          Settings
        </h1>
      </div>

      {feedbackMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            backgroundColor: feedbackMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedbackMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: feedbackMsg.type === 'success' ? '#166534' : '#b91c1c',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {feedbackMsg.type === 'success' ? <Check size={16} /> : <ShieldAlert size={16} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* LEFT / MAIN COLUMN: Store Locations Manager */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            border: '1px solid #e8e2d8',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Card Title & Add Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f0eae1',
              paddingBottom: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#fff8f4',
                  border: '1px solid #e8e2d8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Store size={18} color="#0ea5e9" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#211a13' }}>
                  Store Branches &amp; Locations
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#8a7a6a' }}>
                  {physicalStores.length} configured physical boutiques
                </span>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(!isAddOpen);
                  setAddError(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: isAddOpen ? '#f1f5f9' : '#0ea5e9',
                  color: isAddOpen ? '#334155' : '#ffffff',
                  border: isAddOpen ? '1px solid #cbd5e1' : 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isAddOpen ? <X size={14} /> : <Plus size={14} />}
                {isAddOpen ? 'Cancel' : 'Add Store Branch'}
              </button>
            )}
          </div>

          {/* Add New Store Form */}
          {isAddOpen && (
            <form
              onSubmit={handleAddStore}
              style={{
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                border: '1.5px dashed #0ea5e9',
                borderRadius: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0284c7' }}>
                Create New Atelier Branch
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hawassa Lake View Boutique"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
                    Address / Neighborhood *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Piazza Mall, Next to Main Gate"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {addError && (
                <div style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>{addError}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: '#0ea5e9',
                    color: '#ffffff',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: isAdding ? 'wait' : 'pointer',
                  }}
                >
                  {isAdding ? 'Saving Branch...' : 'Create Location'}
                </button>
              </div>
            </form>
          )}

          {/* Stores List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {physicalStores.map((s) => {
              const isSelected = s.id === activeStore.id;
              const isEditing = editingStoreId === s.id;

              if (isEditing) {
                return (
                  <form
                    key={s.id}
                    onSubmit={(e) => handleSaveEdit(e, s.id)}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#f0f9ff',
                      border: '1.5px solid #0ea5e9',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0284c7' }}>
                        Edit Details for "{s.name}"
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#8a7a6a' }}>ID: {s.id}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
                          Store Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
                          Location / Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.8125rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: '#211a13' }}>
                      <input
                        type="checkbox"
                        checked={editIsDefault}
                        onChange={(e) => setEditIsDefault(e.target.checked)}
                        style={{ width: '1rem', height: '1rem', accentColor: '#0ea5e9' }}
                      />
                      <span>Set as Default Primary Boutique</span>
                    </label>

                    {editError && (
                      <div style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>{editError}</div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#475569',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingEdit}
                        style={{
                          padding: '0.45rem 1rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          backgroundColor: '#0ea5e9',
                          color: '#ffffff',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          cursor: isSavingEdit ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Check size={14} /> {isSavingEdit ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={s.id}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${isSelected ? '#0ea5e9' : '#e8e2d8'}`,
                    backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 1px 3px rgba(14, 165, 233, 0.12)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '0.375rem',
                        backgroundColor: isSelected ? '#0ea5e9' : '#f0f9ff',
                        color: isSelected ? '#ffffff' : '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        border: '1px solid #e8e2d8',
                        flexShrink: 0,
                      }}
                    >
                      <Store size={18} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#211a13' }}>
                          {s.name}
                        </span>
                        {s.isDefault && (
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '0.2rem',
                              backgroundColor: '#e0f2fe',
                              color: '#0284c7',
                              border: '1px solid #bae6fd',
                            }}
                          >
                            Default
                          </span>
                        )}
                        {isSelected && (
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '0.2rem',
                              backgroundColor: '#0ea5e9',
                              color: '#ffffff',
                            }}
                          >
                            Active View
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          marginTop: '0.2rem',
                        }}
                      >
                        <MapPin size={13} color="#8a7a6a" />
                        <span>{s.location}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!isSelected && (
                      <button
                        type="button"
                        onClick={() => setActiveStoreId(s.id)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '0.25rem',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Set Active
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => startEditing(s)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '0.25rem',
                          border: '1px solid #e8e2d8',
                          backgroundColor: '#ffffff',
                          color: '#0284c7',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Pencil size={12} /> Edit
                      </button>
                    )}

                    {isAdmin && !s.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteStore(s)}
                        title="Delete Store Branch"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.35rem',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '0.25rem',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Store Highlight & System Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Store Focus Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              border: '1px solid #e8e2d8',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderBottom: '1px solid #f0eae1', paddingBottom: '0.625rem' }}>
              <Sparkles size={16} color="#0ea5e9" />
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#211a13' }}>
                Active Atelier Focus
              </h3>
            </div>

            <div>
              <span style={{ fontSize: '0.6875rem', color: '#8a7a6a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current Dashboard Scope
              </span>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0284c7', marginTop: '0.15rem' }}>
                {activeStore.name}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={13} /> {activeStore.location}
              </div>
            </div>

            <div style={{ padding: '0.65rem 0.75rem', backgroundColor: '#fcfbf9', borderRadius: '0.375rem', border: '1px solid #ede8e0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
              Orders, product catalogs, and inventory decrements filter directly by the active store selected above.
            </div>
          </div>

          {/* System Alerts Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              border: '1px solid #e8e2d8',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderBottom: '1px solid #f0eae1', paddingBottom: '0.625rem' }}>
              <Bell size={16} color="#0ea5e9" />
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#211a13' }}>
                Notification Preferences
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600, color: '#211a13' }}>
                <span>Low Stock Threshold Alerts</span>
                <input
                  type="checkbox"
                  checked={stockAlerts}
                  onChange={(e) => handleStockAlertsChange(e.target.checked)}
                  style={{ width: '1rem', height: '1rem', accentColor: '#0ea5e9' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600, color: '#211a13' }}>
                <span>New Mobile Order Notifications</span>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => handleEmailAlertsChange(e.target.checked)}
                  style={{ width: '1rem', height: '1rem', accentColor: '#0ea5e9' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
