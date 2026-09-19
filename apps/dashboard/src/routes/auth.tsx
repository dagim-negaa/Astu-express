import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { authClient } from '../lib/auth-client';
import { useAdminStore } from '../store/AdminStore';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { StorefrontLayout } from '../components/storefront/StorefrontLayout';
import { LogIn, UserPlus, Shield, CheckCircle2, AlertCircle, UserCheck, LogOut, ShoppingBag, Package } from 'lucide-react';

export const Route = createFileRoute('/auth')({
  component: AuthComponent,
});

function AuthComponent() {
  const navigate = useNavigate();
  const { login: adminLogin } = useAdminStore();
  const { customer, isLoggedIn, logout, setCustomerSession } = useCustomerAuth();
  
  // Tabs: 'customer_login' | 'customer_register' | 'admin_login'
  const [activeTab, setActiveTab] = useState<'customer_login' | 'customer_register' | 'admin_login'>('customer_login');
  
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', password: '' });
  const [adminForm, setAdminForm] = useState({ email: 'admin@admin.com', password: 'admin1234' });
  const [selectedQuickRole, setSelectedQuickRole] = useState<string>('admin');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check URL params for ?admin=true or ?tab=admin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('tab') === 'admin') {
      setActiveTab('admin_login');
    }
  }, []);

  const quickRoles = [
    { role: 'Owner', email: 'owner@r2express.com', pass: 'admin1234', desc: 'Master account with full privileges' },
    { role: 'Admin', email: 'admin@admin.com', pass: 'admin1234', desc: 'Master admin with full permissions' },
    { role: 'Manager', email: 'manager@r2express.com', pass: 'manager1234', desc: 'Purchases, expenses, shipments & reports' },
    { role: 'Operator', email: 'operator@r2express.com', pass: 'operator1234', desc: 'Orders, products & customer handling' },
  ];

  const handleQuickFill = (roleItem: typeof quickRoles[0]) => {
    setSelectedQuickRole(roleItem.role.toLowerCase());
    setAdminForm({ email: roleItem.email, password: roleItem.pass });
    setError('');
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (activeTab === 'customer_login') {
        const cleanEmail = customerForm.email.trim().toLowerCase();
        let result = await apiClient.signIn(cleanEmail, customerForm.password);
        let token = result.data?.token || result.data?.session?.token;
        let userData = result.data?.user;

        if (!result.success) {
          const baRes = await authClient.signIn.email({
            email: cleanEmail,
            password: customerForm.password,
          });
          if (baRes.error) {
            setError(baRes.error.message || result.error || 'Customer sign in failed. Please check credentials.');
            return;
          }
          token = (baRes.data as any)?.token || (baRes.data as any)?.session?.token;
          userData = baRes.data?.user;
        }

        const customerObj = {
          id: userData?.id,
          name: userData?.name || cleanEmail.split('@')[0],
          email: userData?.email || cleanEmail,
          phone: userData?.phone,
          role: 'customer',
        };
        setCustomerSession(customerObj, token);

        // Also ensure customer record exists in admin customers list
        try {
          await apiClient.createCustomer({
            name: customerObj.name,
            email: customerObj.email,
            phone: customerObj.phone || 'N/A',
          });
        } catch {
          // Backend auto-sync will handle it
        }

        setSuccessMsg('Signed in successfully! Welcome, ' + customerObj.name);
        setTimeout(() => {
          navigate({ to: '/' });
        }, 600);
      } else {
        const cleanName = customerForm.name.trim();
        const cleanEmail = customerForm.email.trim().toLowerCase();
        let result = await apiClient.signUp({
          name: cleanName,
          email: cleanEmail,
          password: customerForm.password,
        });
        let token = result.data?.token || result.data?.session?.token;
        let userData = result.data?.user;

        if (!result.success) {
          const baRes = await authClient.signUp.email({
            name: cleanName,
            email: cleanEmail,
            password: customerForm.password,
          });
          if (baRes.error) {
            setError(baRes.error.message || result.error || 'Customer registration failed.');
            return;
          }
          token = (baRes.data as any)?.token || (baRes.data as any)?.session?.token;
          userData = baRes.data?.user;
        }

        const customerObj = {
          id: userData?.id,
          name: cleanName,
          email: cleanEmail,
          role: 'customer',
        };
        setCustomerSession(customerObj, token);

        // Explicitly sync to customers directory
        try {
          await apiClient.createCustomer({
            name: cleanName,
            email: cleanEmail,
            phone: 'N/A',
          });
        } catch {
          // Backend auto-sync will handle it
        }

        setSuccessMsg('Customer account registered successfully! Welcome, ' + cleanName);
        setTimeout(() => {
          navigate({ to: '/' });
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await adminLogin(adminForm.email, adminForm.password);
      if (res.success) {
        setSuccessMsg('Staff credentials verified! Entering ASTU Express ERP...');
        setTimeout(() => {
          navigate({ to: '/admin' });
        }, 500);
      } else {
        setError(res.error || 'Invalid staff credentials or role not assigned.');
      }
    } catch (err: any) {
      setError(err.message || 'Staff authentication error');
    } finally {
      setLoading(false);
    }
  };

  // When customer is already logged in, do not display registration or admin login!
  if (isLoggedIn && customer) {
    return (
      <StorefrontLayout>
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <UserCheck size={32} />
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full mb-3">
              <span>● Active Customer Session</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Welcome, {customer.name}!
            </h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              You are currently logged in as <strong className="text-slate-800">{customer.email}</strong>.
              Registration and administrative sign-in forms are hidden while your customer account is active.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left mb-6 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-900">{customer.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Registered Email:</span>
                <span className="font-bold text-slate-900">{customer.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Account Type:</span>
                <span className="font-bold text-sky-700 uppercase tracking-wider">Ethiopian Express Customer</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Link
                to="/shop"
                className="py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ShoppingBag size={15} />
                <span>Shop Garments</span>
              </Link>
              <Link
                to="/orders"
                search={{}}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Package size={15} />
                <span>Order History</span>
              </Link>
            </div>

            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut size={14} />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-slate-900">
              {activeTab === 'admin_login'
                ? 'ASTU Express Staff Portal'
                : activeTab === 'customer_login'
                ? 'Customer Sign In'
                : 'Create Customer Account'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {activeTab === 'admin_login'
                ? 'Authorized access for Owner, Admin, Manager, and Operator'
                : 'Access your order history and live shipping updates'}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1 mb-6">
            <button
              onClick={() => { setActiveTab('customer_login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'customer_login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Login
            </button>
            <button
              onClick={() => { setActiveTab('customer_register'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'customer_register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customer Register
            </button>
            <button
              onClick={() => { setActiveTab('admin_login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'admin_login'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-sky-700 bg-sky-100/60 hover:bg-sky-100'
              }`}
            >
              <Shield size={13} />
              <span>Admin Login</span>
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Customer Form */}
            {activeTab !== 'admin_login' ? (
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                {activeTab === 'customer_register' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Abebe Bikila"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={customerForm.password}
                    onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {activeTab === 'customer_login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                  {loading ? 'Please wait...' : activeTab === 'customer_login' ? 'Sign In as Customer' : 'Create Customer Account'}
                </button>
              </form>
            ) : (
              /* Admin & Staff Portal Form */
              <div className="space-y-5">
                {/* Role selection quick-fills */}
                <div>
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Quick-Fill Staff Account (4 Strict Roles)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {quickRoles.map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => handleQuickFill(r)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedQuickRole === r.role.toLowerCase()
                            ? 'border-sky-600 bg-sky-50 ring-1 ring-sky-600'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">{r.role}</span>
                          <span className="text-[10px] text-sky-600 font-mono font-bold">Select</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Staff Email</label>
                    <input
                      type="email"
                      required
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Shield size={16} className="text-sky-400" />
                    {loading ? 'Authenticating Staff...' : 'Sign In to Admin ERP'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
