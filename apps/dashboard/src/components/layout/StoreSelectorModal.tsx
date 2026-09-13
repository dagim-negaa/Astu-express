import React, { useState } from 'react';
import { CreateStoreSchema, UpdateStoreSchema, validateData } from '@astu/shared';
import { useAdminStore, type StoreLocation } from '../../store/AdminStore';
import { Modal } from '../ui/Modal';
import { Store, Plus, Check, MapPin, Trash2, Pencil } from 'lucide-react';

interface StoreSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreSelectorModal: React.FC<StoreSelectorModalProps> = ({ isOpen, onClose }) => {
  const { stores, activeStore, setActiveStoreId, addStore, updateStore, deleteStore, currentUser } = useAdminStore();
  const isAdmin = currentUser.role?.toLowerCase() === 'admin';
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreLocation | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    const validation = validateData(CreateStoreSchema, {
      name: name.trim(),
      location: location.trim(),
    });
    if (!validation.success) {
      setErrorMsg(validation.error);
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await addStore(name.trim(), location.trim());
      setName('');
      setLocation('');
      setIsAddMode(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create store branch. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingStore) return;

    const validation = validateData(UpdateStoreSchema, {
      name: editName.trim(),
      location: editLocation.trim(),
    });
    if (!validation.success) {
      setErrorMsg(validation.error);
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await updateStore(editingStore.id, {
        name: editName.trim(),
        location: editLocation.trim(),
      });
      setEditingStore(null);
      setEditName('');
      setEditLocation('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update store branch. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Atelier Store Locations">
      {!isAddMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stores.map((s) => {
              const isSelected = s.id === activeStore.id;
              const isAll = s.id === 'all';
              if (editingStore?.id === s.id) {
                return (
                  <form
                    key={s.id}
                    onSubmit={handleUpdateStore}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.375rem',
                      border: '1.5px solid #0ea5e9',
                      backgroundColor: '#f0f9ff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0284c7' }}>
                      Edit Store Details
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Store Name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '0.25rem',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8125rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="text"
                      required
                      placeholder="City / Address Location"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '0.25rem',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8125rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    {errorMsg && (
                      <div style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>{errorMsg}</div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          setEditingStore(null);
                          setErrorMsg(null);
                        }}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '0.25rem',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#475569',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '0.25rem',
                          border: 'none',
                          backgroundColor: '#0ea5e9',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: isSaving ? 'wait' : 'pointer',
                        }}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveStoreId(s.id);
                    onClose();
                  }}
                  style={{
                    padding: '0.75rem 0.875rem',
                    borderRadius: '0.375rem',
                    border: `1px solid ${isSelected ? '#0ea5e9' : '#e8e2d8'}`,
                    backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Store size={20} color={isSelected ? '#0ea5e9' : '#8a7a6a'} />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#211a13' }}>
                        {s.name} {s.isDefault && !isAll && <span style={{ fontSize: '0.6875rem', color: '#0284c7', fontWeight: 700 }}>(Default)</span>}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#8a7a6a', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
                        {isAll ? <span>All branches &amp; warehouse inventories</span> : <><MapPin size={13} /> {s.location}</>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {isSelected && <Check size={18} color="#0ea5e9" />}
                    {isAdmin && !isAll && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStore(s);
                          setEditName(s.name);
                          setEditLocation(s.location);
                          setErrorMsg(null);
                        }}
                        title="Edit Store Details"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '0.25rem',
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                    {isAdmin && !s.isDefault && !isAll && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete "${s.name}"?`)) {
                            deleteStore(s.id);
                          }
                        }}
                        title="Delete Store"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '0.25rem',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isAdmin ? (
            <button
              onClick={() => setIsAddMode(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px dashed #cbd5e1',
                backgroundColor: '#fcfbf9',
                color: '#0284c7',
                fontWeight: 700,
                fontSize: '0.78125rem',
                cursor: 'pointer',
                marginTop: '0.375rem',
              }}
            >
              <Plus size={15} /> Add New Store Location
            </button>
          ) : (
            <span style={{ textAlign: 'center', fontSize: '0.75rem', color: '#8a7a6a', padding: '0.35rem 0' }}>
              Store creation restricted to Atelier Administrators.
            </span>
          )}
        </div>
      ) : (
        <form onSubmit={handleAddStore} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
              Store Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Adama Store / Hawassa Atelier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
              City / Address Location
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Adama Main Hub, Ethiopia"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>
          {errorMsg && (
            <div style={{ padding: '0.45rem 0.65rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.375rem' }}>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setIsAddMode(false);
                setErrorMsg(null);
              }}
              style={{ padding: '0.45rem 0.875rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', fontSize: '0.8125rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '0.45rem 0.875rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: isSaving ? '#38bdf8' : '#0ea5e9',
                color: '#ffffff',
                fontWeight: 700,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {isSaving ? 'Saving Branch...' : 'Save Store'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
