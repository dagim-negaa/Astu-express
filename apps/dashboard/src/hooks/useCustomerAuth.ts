import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { authClient } from '../lib/auth-client';

export interface CustomerUser {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

const CUSTOMER_USER_KEY = 'astu_customer_user';
const AUTH_TOKEN_KEY = 'astu_auth_token';
export const CUSTOMER_AUTH_EVENT = 'astu_customer_auth_change';

function getStoredCustomer(): CustomerUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CUSTOMER_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function notifyCustomerAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CUSTOMER_AUTH_EVENT));
  }
}

export function useCustomerAuth() {
  const [customer, setCustomer] = useState<CustomerUser | null>(getStoredCustomer);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!customer && !!customer.email;

  const refreshSession = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setCustomer(null);
      localStorage.removeItem(CUSTOMER_USER_KEY);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.getMe();
      if (res.success && res.data?.authenticated && res.data.user) {
        const u = res.data.user;
        const customerProfile: CustomerUser = {
          id: u.id,
          name: u.name || u.email?.split('@')[0] || 'Customer',
          email: u.email,
          phone: (u as any).phone && (u as any).phone !== 'N/A' ? (u as any).phone : undefined,
          role: u.role || 'customer',
        };
        setCustomer(customerProfile);
        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(customerProfile));
      } else if (res.statusCode === 401 || !res.success) {
        setCustomer(null);
        localStorage.removeItem(CUSTOMER_USER_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {
      // Keep cached customer from localStorage on network hiccup
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();

    const handleAuthChange = () => {
      setCustomer(getStoredCustomer());
    };

    window.addEventListener(CUSTOMER_AUTH_EVENT, handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener(CUSTOMER_AUTH_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await apiClient.signOut();
    } catch {}
    try {
      await authClient.signOut();
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.removeItem(CUSTOMER_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setCustomer(null);
      notifyCustomerAuthChange();
    }
  }, []);

  const setCustomerSession = useCallback((user: CustomerUser, token?: string) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      }
      localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
      setCustomer(user);
      notifyCustomerAuthChange();
    }
  }, []);

  return {
    customer,
    isLoggedIn,
    isLoading,
    refreshSession,
    logout,
    setCustomerSession,
  };
}
