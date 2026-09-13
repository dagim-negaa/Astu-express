import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAdminStore, type StaffMember, type StaffRole } from '../../store/AdminStore';
import { CreateStaffSchema, validateData } from '@astu/shared';
import { Modal } from '../../components/ui/Modal';
import {
  UserCheck,
  UserPlus,
  Shield,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Crown,
} from 'lucide-react';

export const Route = createFileRoute('/admin/staff')({
  component: StaffComponent,
});

function StaffComponent() {
  const { staff, addStaffMember, updateStaffMember, deleteStaffMember, currentUser } = useAdminStore();
  const isAdmin = currentUser.role?.toLowerCase() === 'admin' || currentUser.role?.toLowerCase() === 'owner';
  const staffMembers = staff;

  // Page-level Inline Notification
  const [pageNotification, setPageNotification] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (pageNotification) {
      const timer = setTimeout(() => setPageNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [pageNotification]);

  // Create Staff Modal State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StaffRole>('Operator');

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<StaffRole>('Operator');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editNewPassword, setEditNewPassword] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Only Administrators have permission to register new staff.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    const validation = validateData(CreateStaffSchema, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      role,
    });
    if (!validation.success) {
      setErrorMsg(validation.error);
      return;
    }

    setIsSubmitting(true);
    const effectivePassword = password.trim();

    const res = await addStaffMember({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: effectivePassword,
      role,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`Staff profile created for ${name.trim()} with login credentials.`);
      setTimeout(() => {
        setName('');
        setEmail('');
        setPassword('');
        setRole('Operator');
        setIsAddStaffOpen(false);
        setSuccessMsg(null);
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Failed to create staff member.');
    }
  };

  const handleOpenEditModal = (s: StaffMember) => {
    if (!isAdmin) {
      setPageNotification({ type: 'error', message: 'Only Administrators can modify staff accounts.' });
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setEditingStaff(s);
    setEditName(s.name);
    setEditRole(s.role);
    setEditStatus(s.status);
    setEditNewPassword('');
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Only Administrators have permission to edit staff members.');
      return;
    }
    if (!editingStaff) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!editName.trim()) {
      setErrorMsg('Staff name cannot be empty.');
      return;
    }

    if (editNewPassword && editNewPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    const res = await updateStaffMember(editingStaff.id, {
      name: editName.trim(),
      role: editRole,
      status: editStatus,
      ...(editNewPassword.trim() ? { password: editNewPassword.trim() } : {}),
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`Updated details for ${editName.trim()} successfully.`);
      setTimeout(() => {
        setEditingStaff(null);
        setSuccessMsg(null);
      }, 1000);
    } else {
      setErrorMsg(res.error || 'Failed to update staff member.');
    }
  };

  const handleDeleteStaff = async (s: StaffMember) => {
    if (!isAdmin) {
      setPageNotification({ type: 'error', message: 'Only Administrators can delete staff accounts.' });
      return;
    }

    if (s.id === currentUser.id) {
      setPageNotification({ type: 'error', message: 'You cannot delete your own currently logged-in account.' });
      return;
    }

    if (s.id === 'admin-seed-1') {
      setPageNotification({ type: 'error', message: 'The Primary Master Admin account cannot be deleted.' });
      return;
    }

    if (confirm(`Are you sure you want to permanently delete staff member "${s.name}" (${s.email})?`)) {
      const res = await deleteStaffMember(s.id);
      if (!res.success) {
        setPageNotification({ type: 'error', message: res.error || 'Failed to delete staff member.' });
      } else {
        setPageNotification({ type: 'success', message: `Staff member "${s.name}" was removed successfully.` });
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'EB Garamond, Georgia, serif', margin: 0, color: '#211a13' }}>
            Staff
          </h1>
        </div>

        {isAdmin ? (
          <button
            onClick={() => {
              setErrorMsg(null);
              setSuccessMsg(null);
              setIsAddStaffOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#0ea5e9',
              color: '#ffffff',
              padding: '0.5rem 0.9rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(14, 165, 233, 0.25)',
            }}
          >
            <UserPlus size={15} /> Add Staff Member
          </button>
        ) : (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8a7a6a', backgroundColor: '#f5efe6', padding: '0.35rem 0.65rem', borderRadius: '0.25rem' }}>
            Read-Only (Operator Access)
          </span>
        )}
      </div>

      {/* Inline Page Notification Banner */}
      {pageNotification && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '0.375rem',
            backgroundColor: pageNotification.type === 'error' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${pageNotification.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            color: pageNotification.type === 'error' ? '#b91c1c' : '#15803d',
            fontSize: '0.8125rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {pageNotification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{pageNotification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setPageNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Staff Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e8e2d8', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e8e2d8', fontWeight: 700, fontSize: '0.8125rem', color: '#211a13' }}>
          Team Members ({staffMembers.length})
        </div>

        {staffMembers.length === 0 ? (
          <div style={{ padding: '3rem 1.25rem', textAlign: 'center', color: '#8a7a6a' }}>
            <UserCheck size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#211a13' }}>No staff members registered.</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem' }}>Click "Add Staff Member" above to create an operator or administrator account.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fcfbf9', borderBottom: '1px solid #e8e2d8', color: '#786c5e' }}>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Staff Name</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Email Address</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Role</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Joined Date</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Status</th>
                  {isAdmin && <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', textAlign: 'right' }}>Manage Staff</th>}
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((s) => {
                  const isStaffAdmin = s.role === 'Admin';
                  const isCurrent = s.id === currentUser.id;
                  const isMasterAdmin = s.id === 'admin-seed-1';

                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f8f6f0' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#211a13' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div
                            style={{
                              width: '2rem',
                              height: '2rem',
                              borderRadius: '50%',
                              backgroundColor: isStaffAdmin ? '#211a13' : '#e0f2fe',
                              color: isStaffAdmin ? '#38bdf8' : '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.8125rem',
                            }}
                          >
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span>{s.name}</span>
                            {isCurrent && (
                              <span style={{ marginLeft: '0.4rem', fontSize: '0.6875rem', fontWeight: 700, color: '#0284c7', backgroundColor: '#e0f2fe', padding: '0.1rem 0.35rem', borderRadius: '0.2rem' }}>
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#524535' }}>{s.email}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {(() => {
                          const r = s.role?.toLowerCase();
                          let bg = '#eff6ff';
                          let text = '#1e40af';
                          let border = '#bfdbfe';
                          let Icon = Shield;
                          if (r === 'owner') {
                            bg = '#f3e8ff';
                            text = '#6b21a8';
                            border = '#d8b4fe';
                            Icon = Crown;
                          } else if (r === 'admin') {
                            bg = '#e0f2fe';
                            text = '#0369a1';
                            border = '#bae6fd';
                            Icon = ShieldCheck;
                          } else if (r === 'manager') {
                            bg = '#fef3c7';
                            text = '#92400e';
                            border = '#fde68a';
                            Icon = Shield;
                          }
                          return (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                backgroundColor: bg,
                                color: text,
                                border: `1px solid ${border}`,
                              }}
                            >
                              <Icon size={12} />
                              {s.role}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#8a7a6a' }}>{s.joinedDate}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: s.status === 'Active' ? '#16a34a' : '#64748b',
                            backgroundColor: s.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.25rem',
                          }}
                        >
                          {s.status}
                        </span>
                      </td>

                      {/* Manage Staff Actions Column (Admin Only) */}
                      {isAdmin && (
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditModal(s)}
                              style={{
                                padding: '0.35rem 0.6rem',
                                borderRadius: '0.25rem',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#211a13',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="Edit Staff Details"
                            >
                              <Edit2 size={12} /> Edit
                            </button>

                            {/* Delete Button */}
                            {!isMasterAdmin && !isCurrent && (
                              <button
                                onClick={() => handleDeleteStaff(s)}
                                style={{
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: '0.25rem',
                                  border: '1px solid #fecaca',
                                  backgroundColor: '#fff5f5',
                                  color: '#b91c1c',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                                title="Delete Staff Member"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <Modal isOpen={isAddStaffOpen} onClose={() => setIsAddStaffOpen(false)} title="Add Staff Member">
        <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: '#b91c1c', fontSize: '0.78125rem' }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.375rem', color: '#15803d', fontSize: '0.78125rem' }}>
              <CheckCircle2 size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
              Full Name *
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Dawit Tadesse"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
              Email Address (Login ID) *
            </label>
            <input
              required
              type="email"
              placeholder="e.g. dawit@astugarment.et"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
              Initial Password *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#8a7a6a' }}>
                <KeyRound size={14} />
              </span>
              <input
                required
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.65rem 0.45rem 2rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#8a7a6a', marginTop: '0.2rem', display: 'block' }}>
              Credentials used to log into the R2 Express Web Admin portal.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
              Assigned Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem', backgroundColor: '#ffffff' }}
            >
              <option value="Operator">Operator (Product Orders & Image Uploads)</option>
              <option value="Manager">Manager (Supplier POs, Expenses & Shipments)</option>
              <option value="Admin">Admin (Full System Administrator)</option>
              <option value="Owner">Owner (Master Account - Full Control)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '0.5rem',
              backgroundColor: '#0ea5e9',
              color: '#ffffff',
              padding: '0.55rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Staff Profile & Credentials'}
          </button>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal isOpen={!!editingStaff} onClose={() => setEditingStaff(null)} title={`Edit Staff Member: ${editingStaff?.name}`}>
        {editingStaff && (
          <form onSubmit={handleUpdateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: '#b91c1c', fontSize: '0.78125rem' }}>
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.375rem', color: '#15803d', fontSize: '0.78125rem' }}>
                <CheckCircle2 size={15} />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
                Full Name *
              </label>
              <input
                required
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
                Email Address (Locked)
              </label>
              <input
                disabled
                type="email"
                value={editingStaff.email}
                style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #e8e2d8', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.8125rem', cursor: 'not-allowed' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as StaffRole)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem', backgroundColor: '#ffffff' }}
                >
                  <option value="Operator">Operator</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem', backgroundColor: '#ffffff' }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#211a13', marginBottom: '0.25rem' }}>
                Reset Password (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#8a7a6a' }}>
                  <KeyRound size={14} />
                </span>
                <input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem 0.45rem 2rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
                />
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#8a7a6a', marginTop: '0.2rem', display: 'block' }}>
                Enter a new password (min 6 characters) if you want to reset this staff member's credentials.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#0ea5e9',
                  color: '#ffffff',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
