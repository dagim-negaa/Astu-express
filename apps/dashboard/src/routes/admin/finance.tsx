import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import {
  Landmark,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Building2,
  PhoneCall,
  Coins,
  Search,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export const Route = createFileRoute('/admin/finance')({
  component: FinanceComponent,
});

export function FinanceComponent() {
  const queryClient = useQueryClient();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [txnSearch, setTxnSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // 1. Fetch Bank Accounts
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      const res = await apiClient.listBankAccounts();
      return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
    },
  });

  // 2. Fetch Finance Dashboard Analytics
  const { data: dashboard } = useQuery({
    queryKey: ['financeDashboard'],
    queryFn: async () => {
      const res = await apiClient.getFinanceDashboard();
      return res.data;
    },
  });

  // 3. Fetch Financial Transactions Ledger
  const { data: transactions = [], isLoading: isLoadingTxns } = useQuery({
    queryKey: ['financialTransactions'],
    queryFn: async () => {
      const res = await apiClient.getFinancialTransactions(150);
      return Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
    },
  });

  // Form states
  const [accountForm, setAccountForm] = useState({
    accountName: '',
    bankName: 'Commercial Bank of Ethiopia',
    accountNumber: '',
    accountType: 'bank' as const,
    initialBalance: 0,
    isDefault: false,
  });

  const [depositForm, setDepositForm] = useState({
    accountId: '',
    amountEtb: 0,
    description: '',
    category: 'working_capital',
    date: new Date().toISOString().split('T')[0],
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amountEtb: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: async (data: typeof accountForm) => apiClient.createBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] });
      setIsAccountModalOpen(false);
      setAccountForm({
        accountName: '',
        bankName: 'Commercial Bank of Ethiopia',
        accountNumber: '',
        accountType: 'bank',
        initialBalance: 0,
        isDefault: false,
      });
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: typeof depositForm) =>
      apiClient.depositToAccount(data.accountId, {
        amountEtb: Number(data.amountEtb),
        description: data.description,
        category: data.category,
        date: data.date,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] });
      setIsDepositModalOpen(false);
      setDepositForm({
        accountId: '',
        amountEtb: 0,
        description: '',
        category: 'working_capital',
        date: new Date().toISOString().split('T')[0],
      });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (data: typeof transferForm) =>
      apiClient.transferFunds({
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amountEtb: Number(data.amountEtb),
        description: data.description,
        date: data.date,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financialTransactions'] });
      setIsTransferModalOpen(false);
      setTransferForm({
        fromAccountId: '',
        toAccountId: '',
        amountEtb: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    },
  });

  // Calculate totals
  const totalLiquidity = accounts.reduce((sum: number, a: any) => sum + (Number(a.currentBalance) || 0), 0);
  const bankAccountsList = Array.isArray(accounts) ? accounts : [];
  const txnList = Array.isArray(transactions) ? transactions : [];

  const filteredTxns = txnList.filter((t: any) => {
    const matchesSearch =
      t.description?.toLowerCase().includes(txnSearch.toLowerCase()) ||
      t.referenceId?.toLowerCase().includes(txnSearch.toLowerCase()) ||
      t.bankName?.toLowerCase().includes(txnSearch.toLowerCase()) ||
      t.accountName?.toLowerCase().includes(txnSearch.toLowerCase());
    const matchesType = !typeFilter || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'telebirr':
        return <PhoneCall size={20} color="#0284c7" />;
      case 'cash':
        return <Coins size={20} color="#16a34a" />;
      default:
        return <Building2 size={20} color="#0369a1" />;
    }
  };

  const getTxnBadge = (type: string) => {
    switch (type) {
      case 'deposit':
        return { label: 'Capital Deposit', bg: '#f0fdf4', color: '#16a34a', icon: <ArrowDownLeft size={13} /> };
      case 'sale_income':
        return { label: 'Order Revenue', bg: '#eff6ff', color: '#0284c7', icon: <ArrowDownLeft size={13} /> };
      case 'expense':
        return { label: 'Operational Expense', bg: '#fef2f2', color: '#dc2626', icon: <ArrowUpRight size={13} /> };
      case 'supplier_payment':
        return { label: 'Supplier Procurement', bg: '#fff7ed', color: '#ea580c', icon: <ArrowUpRight size={13} /> };
      case 'transfer':
        return { label: 'Inter-Account Sweep', bg: '#faf5ff', color: '#9333ea', icon: <ArrowLeftRight size={13} /> };
      default:
        return { label: type, bg: '#f1f5f9', color: '#475569', icon: null };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Hanken Grotesk, sans-serif', margin: 0, color: '#0f172a' }}>
            Treasury, Banking & Capital Liquidity
          </h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
            ASTU Express Ethiopian Financial System — Real-time bank accounts, initial working capital, expense settlement & revenue ledger.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (bankAccountsList.length > 0) {
                setDepositForm((prev) => ({ ...prev, accountId: bankAccountsList[0].id }));
              }
              setIsDepositModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              padding: '0.5rem 0.85rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <ArrowDownLeft size={15} /> Deposit Funds
          </button>

          <button
            onClick={() => {
              if (bankAccountsList.length >= 2) {
                setTransferForm((prev) => ({
                  ...prev,
                  fromAccountId: bankAccountsList[0].id,
                  toAccountId: bankAccountsList[1].id,
                }));
              }
              setIsTransferModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              padding: '0.5rem 0.85rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <ArrowLeftRight size={15} /> Transfer Funds
          </button>

          <button
            onClick={() => setIsAccountModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '0.5rem 0.85rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Add Bank Account
          </button>
        </div>
      </div>

      {/* Primary Liquidity Overview Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.15)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Working Capital Liquidity
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, fontFamily: 'Hanken Grotesk, sans-serif', color: '#38bdf8', marginTop: '0.25rem' }}>
            ETB {totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
            Aggregated balance across {bankAccountsList.length} verified operating accounts & vaults
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderLeft: '1px solid #334155', paddingLeft: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cumulative Revenue</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ade80' }}>
              ETB {(dashboard?.totalRevenue || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Operating Expenses</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>
              ETB {(dashboard?.totalExpenses || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Net Operating Profit</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (dashboard?.netProfit || 0) >= 0 ? '#4ade80' : '#f87171' }}>
              ETB {(dashboard?.netProfit || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Gross Margin</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
              {dashboard?.profitMargin || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Operating Accounts & Payment Gateways
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {bankAccountsList.length} Accounts Active
          </span>
        </div>

        {isLoadingAccounts ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '0.5rem' }}>
            Loading accounts...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {bankAccountsList.map((acc: any) => (
              <div
                key={acc.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.625rem',
                  border: acc.isDefault ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  position: 'relative',
                }}
              >
                {acc.isDefault && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '0.25rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Primary Account
                  </span>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                    <div style={{ backgroundColor: '#f1f5f9', padding: '0.5rem', borderRadius: '0.5rem' }}>
                      {getAccountIcon(acc.accountType)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a' }}>
                        {acc.accountName}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {acc.bankName} • {acc.accountNumber}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Available Balance
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem' }}>
                      ETB {(Number(acc.currentBalance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    onClick={() => {
                      setDepositForm((prev) => ({ ...prev, accountId: acc.id }));
                      setIsDepositModalOpen(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <ArrowDownLeft size={13} color="#16a34a" /> Deposit
                  </button>

                  <button
                    onClick={() => {
                      setTransferForm((prev) => ({ ...prev, fromAccountId: acc.id }));
                      setIsTransferModalOpen(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <ArrowLeftRight size={13} color="#6366f1" /> Transfer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial Transactions Ledger */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.625rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Financial Audit & Transaction Ledger
            </h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Real-time balance updates for customer sales, supplier purchase orders, capital deposits, and expenses.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={13} color="#64748b" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search ledger..."
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.35rem 0.5rem 0.35rem 1.8rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.75rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.75rem',
                color: '#334155',
              }}
            >
              <option value="">All Types</option>
              <option value="deposit">Capital Deposit</option>
              <option value="sale_income">Order Revenue</option>
              <option value="expense">Operating Expense</option>
              <option value="supplier_payment">Supplier Payout</option>
              <option value="transfer">Internal Transfer</option>
            </select>
          </div>
        </div>

        {isLoadingTxns ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading ledger...</div>
        ) : filteredTxns.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <Landmark size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>No transactions recorded</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem' }}>Deposits, orders, and expenses will immediately generate ledger entries here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Type</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Description</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em' }}>Account</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '0.625rem 1rem', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.05em', textAlign: 'right' }}>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map((t: any) => {
                  const badge = getTxnBadge(t.type);
                  const isPositive = t.type === 'deposit' || t.type === 'sale_income';
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {t.date || new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.25rem',
                          }}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        <div>{t.description}</div>
                        {t.referenceId && (
                          <span style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: '#64748b' }}>
                            Ref: #{t.referenceId}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334155', fontSize: '0.75rem' }}>
                        <div style={{ fontWeight: 600 }}>{t.bankName || 'Bank Account'}</div>
                        <div style={{ color: '#64748b' }}>{t.accountName}</div>
                      </td>
                      <td
                        style={{
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          fontWeight: 800,
                          color: isPositive ? '#16a34a' : '#dc2626',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isPositive ? '+' : '-'}ETB {Math.abs(Number(t.amountEtb) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        ETB {(Number(t.balanceAfter) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Bank Account Modal */}
      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title="Add Ethiopian Bank Account">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAccountMutation.mutate(accountForm);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Account Nickname *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CBE - Operations / Telebirr Secondary"
              value={accountForm.accountName}
              onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Bank / Gateway *
              </label>
              <select
                value={accountForm.bankName}
                onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              >
                <option>Commercial Bank of Ethiopia</option>
                <option>Telebirr</option>
                <option>Awash Bank</option>
                <option>Bank of Abyssinia</option>
                <option>Dashen Bank</option>
                <option>Cooperative Bank of Oromia</option>
                <option>Cash on Hand</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Account / Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="1000... or 0911..."
                value={accountForm.accountNumber}
                onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Account Type
              </label>
              <select
                value={accountForm.accountType}
                onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value as any })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              >
                <option value="bank">Traditional Bank Account</option>
                <option value="telebirr">Telebirr Merchant</option>
                <option value="cash">Petty Cash / Physical Vault</option>
                <option value="cbe_birr">CBE Birr Wallet</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Initial Capital Balance (ETB)
              </label>
              <input
                type="number"
                min="0"
                value={accountForm.initialBalance || ''}
                onChange={(e) => setAccountForm({ ...accountForm, initialBalance: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              id="isDefaultAccount"
              checked={accountForm.isDefault}
              onChange={(e) => setAccountForm({ ...accountForm, isDefault: e.target.checked })}
            />
            <label htmlFor="isDefaultAccount" style={{ fontSize: '0.8125rem', color: '#334155' }}>
              Set as primary operating account for customer order receipts
            </label>
          </div>

          <button
            type="submit"
            disabled={createAccountMutation.isPending}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '0.625rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              marginTop: '0.5rem',
            }}
          >
            {createAccountMutation.isPending ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </Modal>

      {/* Deposit Capital Modal */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Deposit Working Capital">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            depositMutation.mutate(depositForm);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Destination Account *
            </label>
            <select
              required
              value={depositForm.accountId}
              onChange={(e) => setDepositForm({ ...depositForm, accountId: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            >
              {bankAccountsList.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.accountName} ({a.bankName}) — Available: ETB {Number(a.currentBalance || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Deposit Amount (ETB) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={depositForm.amountEtb || ''}
                onChange={(e) => setDepositForm({ ...depositForm, amountEtb: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Date *
              </label>
              <input
                type="date"
                required
                value={depositForm.date}
                onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Description / Origin *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Founder Capital Injection, Cash deposit from POS"
              value={depositForm.description}
              onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={depositMutation.isPending || !depositForm.accountId || depositForm.amountEtb <= 0}
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              padding: '0.625rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              marginTop: '0.5rem',
            }}
          >
            {depositMutation.isPending ? 'Depositing...' : 'Confirm Deposit'}
          </button>
        </form>
      </Modal>

      {/* Transfer Funds Modal */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Inter-Account Fund Transfer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            transferMutation.mutate(transferForm);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Source Account (From) *
              </label>
              <select
                required
                value={transferForm.fromAccountId}
                onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              >
                <option value="">Select source...</option>
                {bankAccountsList.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.accountName} (ETB {Number(a.currentBalance || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Target Account (To) *
              </label>
              <select
                required
                value={transferForm.toAccountId}
                onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              >
                <option value="">Select destination...</option>
                {bankAccountsList
                  .filter((a: any) => a.id !== transferForm.fromAccountId)
                  .map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} (ETB {Number(a.currentBalance || 0).toLocaleString()})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Transfer Amount (ETB) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={transferForm.amountEtb || ''}
                onChange={(e) => setTransferForm({ ...transferForm, amountEtb: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Date *
              </label>
              <input
                type="date"
                required
                value={transferForm.date}
                onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Memo / Purpose
            </label>
            <input
              type="text"
              placeholder="e.g. Sweep Telebirr daily balance to CBE Operations"
              value={transferForm.description}
              onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.8125rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={
              transferMutation.isPending ||
              !transferForm.fromAccountId ||
              !transferForm.toAccountId ||
              transferForm.amountEtb <= 0
            }
            style={{
              backgroundColor: '#6366f1',
              color: '#ffffff',
              padding: '0.625rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              marginTop: '0.5rem',
            }}
          >
            {transferMutation.isPending ? 'Transferring...' : 'Execute Transfer'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
