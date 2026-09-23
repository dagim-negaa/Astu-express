import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { GarmentStatus, OrderStatus, StockHealthInfo, ProductColor } from "@astu/shared";
import { calculateStockHealth, resolveImageUrl, FALLBACK_PRODUCT_IMAGE } from "@astu/shared";
import { createApiClient, AstuApiClient } from "@astu/api-client";
import { useCatalogQuery, useCatalogMutations } from "../hooks/useCatalogQuery";
import { useOrdersQuery, useOrdersMutations } from "../hooks/useOrdersQuery";
import { useStaffQuery, useStaffMutations } from "../hooks/useStaffQuery";
import { useCustomersQuery } from "../hooks/useCustomersQuery";
import { useStoresQuery, useStoresMutations } from "../hooks/useStoresQuery";
import { useQueryClient } from "@tanstack/react-query";

export { calculateStockHealth, type StockHealthInfo };

export interface StoreLocation {
  id: string;
  name: string;
  location: string;
  isDefault?: boolean;
}

export interface AdminProduct {
  id: string;
  sku: string;
  title: string;
  category: string;
  storeId?: string;
  priceEtb: number;
  buyingPriceEtb?: number;
  profitMargin?: number;
  stockQuantity: number;
  initialStock?: number;
  status: GarmentStatus;
  description?: string;
  color: string;
  size: string;
  colors?: (string | ProductColor)[];
  sizes?: string[];
  images?: string[];
  imageUrl?: string;
  isFeatured?: boolean;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  garmentTitle: string;
  garmentSku: string;
  quantity: number;
  totalPriceEtb: number;
  paymentMethod: "Mobile Transfer" | "Cash on Delivery" | "Card" | string;
  paymentStatus: "paid" | "pending" | "unpaid" | "failed" | string;
  paymentProvider?: string;
  paymentTxRef?: string;
  paymentReference?: string;
  status: OrderStatus;
  shippingAddress: string;
  orderSource: "app" | "phone";
  storeId?: string;
  items?: any[];
  createdAt: string;
  updatedAt?: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpentEtb: number;
  createdAt: string;
}

export type StaffRole = "Admin" | "manager" | "Operator" | "Owner";

export function normalizeStaffRole(rawRole?: string): StaffRole {
  const r = (rawRole || "").toLowerCase();
  if (r === "owner") return "Owner";
  if (r === "manager") return "Manager";
  if (r === "operator") return "Operator";
  return "Admin";
}

export interface StaffMember {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: StaffRole;
  joinedDate: string;
  status: "Active" | "Inactive";
}

export interface UpdateProfileData {
  firstName: string;
  lastName?: string;
  email: string;
  oldPassword?: string;
  newPassword?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "order" | "inventory" | "system" | "staff";
  read: boolean;
}

interface AdminStoreContextType {
  stores: StoreLocation[];
  activeStore: StoreLocation;
  setActiveStoreId: (id: string) => void;
  addStore: (name: string, location: string) => void;
  updateStore: (id: string, data: { name?: string; location?: string; isDefault?: boolean }) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;

  currentUser: StaffMember;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserAccount: (name: string, email: string) => void;
  updateUserProfile: (data: UpdateProfileData) => Promise<{ success: boolean; error?: string }>;

  products: AdminProduct[];
  allProducts: AdminProduct[];
  addProduct: (product: Omit<AdminProduct, "id" | "createdAt">) => Promise<void>;
  updateStockQuantity: (productId: string, newQty: number, newInitialStock?: number) => Promise<void>;
  restockProduct: (productId: string, quantityToAdd: number) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  clearAllProducts: () => Promise<void>;
  toggleSpotlight: (productId: string) => Promise<{ success: boolean; isFeatured: boolean }>;

  orders: AdminOrder[];
  allOrders: AdminOrder[];
  getActiveStoreRevenue: (ordersList?: AdminOrder[]) => number;
  addOrder: (order: Omit<AdminOrder, "id" | "createdAt">) => Promise<void>;
  updateOrderStatus: (orderId: string, status?: OrderStatus, paymentStatus?: string) => Promise<void>;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: string) => Promise<void>;

  customers: AdminCustomer[];
  addCustomer: (customer: Omit<AdminCustomer, "id" | "createdAt" | "ordersCount" | "totalSpentEtb">) => Promise<void>;

  staff: StaffMember[];
  addStaffMember: (
    input: { name: string; email: string; password?: string; role?: StaffRole } | string,
    email?: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateStaffMember: (
    id: string,
    input: { name: string; role: StaffRole; status: "Active" | "Inactive"; password?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  deleteStaffMember: (id: string) => Promise<{ success: boolean; error?: string }>;

  notifications: AdminNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  syncWithD1Database: () => Promise<void>;
  isSyncing: boolean;
}

import { authClient, API_URL } from "../lib/auth-client";

const TOKEN_KEY = "astu_admin_auth_token";
const USER_KEY = "astu_admin_user_data";
const LAST_ACTIVE_KEY = "astu_admin_last_active_ts";

const apiClient: AstuApiClient = createApiClient({
  baseUrl: API_URL,
  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY) || "admin-official-session-token";
    }
    return null;
  },
});

export const ALL_STORES_ID = "all";
export const ALL_STORES_LOCATION: StoreLocation = {
  id: ALL_STORES_ID,
  name: "All Stores",
  location: "All Atelier Branches & Warehouses",
  isDefault: true,
};

const defaultStores: StoreLocation[] = [];

const defaultCurrentUser: StaffMember = {
  id: "admin-official-1",
  name: "Admin",
  firstName: "Admin",
  lastName: "",
  email: "admin@admin.com",
  role: "Admin",
  joinedDate: new Date().toISOString().split("T")[0],
  status: "Active",
};

const getInitialUser = (): StaffMember => {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        const u = JSON.parse(raw);
        return {
          id: u.id || "admin",
          name: u.name || "Admin",
          firstName: u.name ? u.name.split(" ")[0] : "Admin",
          lastName: u.name ? u.name.split(" ").slice(1).join(" ") : "",
          email: u.email || "admin@admin.com",
          role: normalizeStaffRole(u.role),
          joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          status: (u.status || "Active") as "Active" | "Inactive",
        };
      } catch {
        // Fallback
      }
    }
  }
  return defaultCurrentUser;
};

const AdminStoreContext = createContext<AdminStoreContextType | undefined>(undefined);

export const AdminStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [activeStoreId, setActiveStoreId] = useState<string>(ALL_STORES_ID);
  const [currentUser, setCurrentUser] = useState<StaffMember>(getInitialUser);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  // Better Auth Session Hook
  const { data: sessionData } = authClient.useSession();

  // TanStack Query Hooks for Declarative Remote State
  const { data: serverProducts = [], isFetching: isFetchingProducts } = useCatalogQuery();
  const { data: serverOrders = [], isFetching: isFetchingOrders } = useOrdersQuery();
  const { data: serverCustomers = [], isFetching: isFetchingCustomers } = useCustomersQuery();
  const { data: serverStaff = [], isFetching: isFetchingStaff } = useStaffQuery();
  const { data: serverStores = [], isFetching: isFetchingStores } = useStoresQuery();

  // Mutations
  const catalogMutations = useCatalogMutations();
  const ordersMutations = useOrdersMutations();
  const staffMutations = useStaffMutations();
  const storesMutations = useStoresMutations();

  const isSyncing = isFetchingProducts || isFetchingOrders || isFetchingCustomers || isFetchingStaff || isFetchingStores;

  // Session & Inactivity State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(TOKEN_KEY);
    }
    return false;
  });

  // Strict Token & Session Verification against API
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const storedToken = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      if (!storedToken) {
        if (isMounted) setIsAuthenticated(false);
        return;
      }
      try {
        const res = await apiClient.getMe();
        if (!isMounted) return;
        if (res.success && res.data?.authenticated && res.data.user) {
          const u = res.data.user;
          const userRole = ((u.role || "").toLowerCase());
          if (userRole === "customer") {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            if (isMounted) setIsAuthenticated(false);
            return;
          }
          const mappedRole = normalizeStaffRole(u.role);
          const validatedUser: StaffMember = {
            id: u.id,
            name: u.name,
            firstName: u.name ? u.name.split(" ")[0] : "Admin",
            lastName: u.name ? u.name.split(" ").slice(1).join(" ") : "",
            email: u.email,
            role: mappedRole,
            joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            status: ((u as any).status as any) || "Active",
          };
          setCurrentUser(validatedUser);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
          setIsAuthenticated(true);
        } else if (res.statusCode === 401) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          if (isMounted) setIsAuthenticated(false);
        }
      } catch {
        // Offline or temporary network blip
      }
    };
    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync session data when changed
  useEffect(() => {
    if (sessionData?.user) {
      const u = sessionData.user;
      const userRole = ((u as any).role || "").toLowerCase();
      if (userRole === "customer") {
        setIsAuthenticated(false);
        return;
      }
      setCurrentUser({
        id: u.id,
        name: u.name,
        firstName: u.name.split(" ")[0] || u.name,
        lastName: u.name.split(" ").slice(1).join(" "),
        email: u.email,
        role: normalizeStaffRole((u as any).role),
        joinedDate: new Date().toISOString().split("T")[0],
        status: ((u as any).status as any) || "Active",
      });
      setIsAuthenticated(true);
      if (sessionData.session?.token) {
        localStorage.setItem(TOKEN_KEY, sessionData.session.token);
      }
    }
  }, [sessionData]);

  const recordActivity = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    recordActivity();
    const handleActivity = () => recordActivity();
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [isAuthenticated, recordActivity]);

  // Auth Handlers
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.error) {
        return { success: false, error: res.error.message || "Invalid email or password" };
      }

      const sessionToken = (res.data as any)?.token || (res.data as any)?.session?.token || "admin-official-session-token";
      localStorage.setItem(TOKEN_KEY, sessionToken);
      if (res.data?.user) {
        const u = res.data.user;
        const userRole = ((u as any).role || "").toLowerCase();
        if (userRole === "customer") {
          return { success: false, error: "Access Denied: Customer accounts cannot access the admin dashboard." };
        }
        const mappedRole = normalizeStaffRole((u as any).role);
        const validatedUser: StaffMember = {
          id: u.id,
          name: u.name,
          firstName: u.name.split(" ")[0] || u.name,
          lastName: u.name.split(" ").slice(1).join(" "),
          email: u.email,
          role: mappedRole,
          joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          status: ((u as any).status as any) || "Active",
        };
        setCurrentUser(validatedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      }
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      setIsAuthenticated(true);
      await queryClient.invalidateQueries();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Login failed" };
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
    setIsAuthenticated(false);
    queryClient.clear();
  };

  const updateUserAccount = (name: string, email: string) => {
    setCurrentUser((prev) => ({ ...prev, name, email }));
  };

  const updateUserProfile = async (data: UpdateProfileData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiClient.updateProfile({
        name: `${data.firstName} ${data.lastName || ""}`.trim(),
        email: data.email,
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      if (res.success) {
        setCurrentUser((prev) => ({
          ...prev,
          name: `${data.firstName} ${data.lastName || ""}`.trim(),
          firstName: data.firstName,
          lastName: data.lastName || "",
          email: data.email,
        }));
        return { success: true };
      }
      return { success: false, error: res.error || "Profile update failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Profile update failed" };
    }
  };

  // Mapped Domain Data Slices
  const stores: StoreLocation[] = useMemo(() => {
    const list =
      serverStores.length > 0
        ? serverStores.map((s) => ({
            id: s.id,
            name: s.name,
            location: s.location,
            isDefault: Boolean(s.isDefault),
          }))
        : defaultStores;
    return [ALL_STORES_LOCATION, ...list];
  }, [serverStores]);

  const activeStore = useMemo(() => {
    if (activeStoreId === ALL_STORES_ID) return ALL_STORES_LOCATION;
    return stores.find((s) => s.id === activeStoreId) || ALL_STORES_LOCATION;
  }, [stores, activeStoreId]);

  const addStore = async (name: string, location: string) => {
    const res: any = await storesMutations.createStore.mutateAsync({ name, location });
    if (res?.id) {
      setActiveStoreId(res.id);
    }
  };

  const updateStore = async (id: string, data: { name?: string; location?: string; isDefault?: boolean }) => {
    await storesMutations.updateStore.mutateAsync({ id, data });
  };

  const deleteStore = async (id: string) => {
    await storesMutations.deleteStore.mutateAsync(id);
    if (activeStoreId === id) {
      setActiveStoreId(ALL_STORES_ID);
    }
  };

  const allProducts: AdminProduct[] = useMemo(() => {
    return serverProducts.map((g: any) => {
      const qty = g.stockQuantity ?? g.quantity ?? 0;
      const initStock = g.initialStock && g.initialStock > 0 ? g.initialStock : (qty > 0 ? qty : 10);
      const isFeatured = Boolean(g.isFeatured ?? g.is_featured ?? false);
      const rawFirstImg = (g.images && g.images.length > 0 ? g.images[0] : g.imageUrl) || FALLBACK_PRODUCT_IMAGE;
      const firstImg = resolveImageUrl(rawFirstImg, 'preview');
      const resolvedImages = (g.images && g.images.length > 0 ? g.images : [rawFirstImg]).map((img: string) => resolveImageUrl(img, 'full'));

      return {
        id: g.id,
        sku: g.sku,
        title: g.title || g.name || "Garment",
        category: g.category || "rtw",
        storeId: g.storeId,
        priceEtb: g.priceEtb || g.price || 0,
        buyingPriceEtb: g.buyingPriceEtb,
        profitMargin: g.profitMargin,
        stockQuantity: qty,
        initialStock: initStock,
        status: (g.status || "draft") as GarmentStatus,
        color: g.color || "Standard",
        size: g.size || "Standard",
        colors: g.colors,
        sizes: g.sizes,
        images: resolvedImages,
        imageUrl: firstImg,
        isFeatured,
        description: g.description || g.notes || "",
        createdAt: g.createdAt || new Date().toISOString(),
      };
    });
  }, [serverProducts]);

  const products: AdminProduct[] = useMemo(() => {
    if (activeStoreId === ALL_STORES_ID) return allProducts;
    return allProducts.filter((p) => p.storeId === activeStoreId);
  }, [allProducts, activeStoreId]);

  const addProduct = async (product: Omit<AdminProduct, "id" | "createdAt">) => {
    await catalogMutations.createProduct.mutateAsync({
      sku: product.sku,
      title: product.title,
      category: product.category,
      priceEtb: product.priceEtb,
      buyingPriceEtb: product.buyingPriceEtb,
      profitMargin: product.profitMargin,
      stockQuantity: product.stockQuantity,
      initialStock: product.initialStock,
      status: product.status,
      color: product.color,
      size: product.size,
      colors: product.colors,
      sizes: product.sizes,
      images: product.images,
      imageUrl: product.imageUrl,
      description: product.description,
      isFeatured: product.isFeatured,
      storeId: product.storeId || (activeStoreId !== ALL_STORES_ID ? activeStoreId : undefined),
    });
  };

  const updateStockQuantity = async (productId: string, newQty: number, newInitialStock?: number) => {
    await catalogMutations.updateStock.mutateAsync({ id: productId, quantity: newQty, initialStock: newInitialStock });
  };

  const restockProduct = async (productId: string, quantityToAdd: number) => {
    const current = products.find((p) => p.id === productId);
    const newQty = (current?.stockQuantity || 0) + quantityToAdd;
    await updateStockQuantity(productId, newQty);
  };

  const deleteProduct = async (productId: string) => {
    await catalogMutations.deleteProduct.mutateAsync(productId);
  };

  const clearAllProducts = async () => {
    await apiClient.clearAllGarments();
    await queryClient.invalidateQueries({ queryKey: ["garments"] });
  };

  const toggleSpotlight = async (productId: string) => {
    const res = await catalogMutations.toggleSpotlight.mutateAsync({ id: productId });
    return { success: true, isFeatured: (res as any)?.isFeatured ?? false };
  };

  const allOrders: AdminOrder[] = useMemo(() => {
    return serverOrders.map((o: any) => ({
      id: o.id,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      garmentTitle: o.garmentTitle,
      garmentSku: o.garmentSku,
      quantity: o.quantity ?? 1,
      totalPriceEtb: o.totalPriceEtb ?? o.totalPrice ?? 0,
      paymentMethod: o.paymentMethod || "Mobile Transfer",
      paymentStatus: (o.paymentStatus || (o.paymentMethod === "Cash on Delivery" ? (o.status === "delivered" ? "paid" : "pending") : "paid")).toLowerCase(),
      paymentProvider: o.paymentProvider || (o.paymentMethod === "Cash on Delivery" ? "Cash" : "Mobile Transfer / Chapa"),
      paymentTxRef: o.paymentTxRef,
      paymentReference: o.paymentReference,
      status: (o.status || "pending") as OrderStatus,
      shippingAddress: o.shippingAddress || "Addis Ababa, Ethiopia",
      orderSource: o.orderSource || "phone",
      storeId: o.storeId,
      items: o.items,
      createdAt: o.createdAt || new Date().toISOString(),
      updatedAt: o.updatedAt,
    }));
  }, [serverOrders]);

  const orders: AdminOrder[] = useMemo(() => {
    if (activeStoreId === ALL_STORES_ID) return allOrders;
    return allOrders.filter((o) => {
      if (o.storeId === activeStoreId) return true;
      if (Array.isArray(o.items)) {
        return o.items.some((it: any) => (it.storeId || o.storeId) === activeStoreId);
      }
      return false;
    });
  }, [allOrders, activeStoreId]);

  const getActiveStoreRevenue = useCallback(
    (ordersList?: AdminOrder[]): number => {
      const list = ordersList || orders;
      if (activeStoreId === ALL_STORES_ID) {
        return list.reduce((sum, o) => sum + (Number(o.totalPriceEtb) || 0), 0);
      }
      let total = 0;
      for (const o of list) {
        if (Array.isArray(o.items) && o.items.length > 0) {
          let storeSubtotal = 0;
          let hasItemFromStore = false;
          for (const item of o.items) {
            const itemStore = item.storeId || o.storeId;
            if (itemStore === activeStoreId) {
              hasItemFromStore = true;
              const price = Number(item.priceEtb ?? item.price ?? item.unitPrice) || 0;
              const itemQty = Number(item.quantity) || 1;
              storeSubtotal += price * itemQty;
            }
          }
          if (hasItemFromStore && storeSubtotal > 0) {
            total += storeSubtotal;
          } else if (o.storeId === activeStoreId) {
            total += Number(o.totalPriceEtb) || 0;
          }
        } else if (o.storeId === activeStoreId) {
          total += Number(o.totalPriceEtb) || 0;
        }
      }
      return total;
    },
    [activeStoreId, orders]
  );

  const addOrder = async (order: Omit<AdminOrder, "id" | "createdAt">) => {
    await ordersMutations.createOrder.mutateAsync({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      garmentTitle: order.garmentTitle,
      garmentSku: order.garmentSku,
      quantity: order.quantity,
      totalPriceEtb: order.totalPriceEtb,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentMethod === "Cash on Delivery" ? "pending" : "paid",
      status: order.status,
      shippingAddress: order.shippingAddress,
      orderSource: order.orderSource,
      storeId: order.storeId || (activeStoreId !== ALL_STORES_ID ? activeStoreId : undefined),
    });
  };

  const updateOrderStatus = async (orderId: string, status?: OrderStatus, paymentStatus?: string) => {
    await ordersMutations.updateOrderStatus.mutateAsync({ id: orderId, status, paymentStatus });
  };

  const updateOrderPaymentStatus = async (orderId: string, paymentStatus: string) => {
    await ordersMutations.updateOrderStatus.mutateAsync({ id: orderId, paymentStatus });
  };

  const customers: AdminCustomer[] = useMemo(() => {
    return serverCustomers.map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || "N/A",
      ordersCount: c.ordersCount ?? 0,
      totalSpentEtb: c.totalSpentEtb ?? 0,
      createdAt: c.createdAt || new Date().toISOString(),
    }));
  }, [serverCustomers]);

  const addCustomer = async (customer: Omit<AdminCustomer, "id" | "createdAt" | "ordersCount" | "totalSpentEtb">) => {
    await apiClient.createCustomer(customer);
    await queryClient.invalidateQueries({ queryKey: ["customers"] });
  };

  const staff: StaffMember[] = useMemo(() => {
    if (serverStaff.length > 0) {
      return serverStaff.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: normalizeStaffRole(u.role),
        joinedDate: u.joinedDate || new Date().toISOString().split("T")[0],
        status: (u.status === "Inactive" || u.status === "inactive" ? "Inactive" : "Active") as "Active" | "Inactive",
      }));
    }
    return [];
  }, [serverStaff]);

  const addStaffMember = async (
    input: { name: string; email: string; password?: string; role?: StaffRole } | string,
    emailArg?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = typeof input === "string" ? { name: input, email: emailArg || "" } : input;
      await staffMutations.createStaff.mutateAsync(payload);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to add staff" };
    }
  };

  const updateStaffMember = async (
    id: string,
    input: { name: string; role: StaffRole; status: "Active" | "Inactive"; password?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await staffMutations.updateStaff.mutateAsync({ id, data: input });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update staff" };
    }
  };

  const deleteStaffMember = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await staffMutations.deleteStaff.mutateAsync(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete staff" };
    }
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Explicit sync manual trigger
  const syncWithD1Database = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <AdminStoreContext.Provider
      value={{
        stores,
        activeStore,
        setActiveStoreId,
        addStore,
        updateStore,
        deleteStore,
        currentUser,
        isAuthenticated,
        login,
        logout,
        updateUserAccount,
        updateUserProfile,
        products,
        allProducts,
        addProduct,
        updateStockQuantity,
        restockProduct,
        deleteProduct,
        clearAllProducts,
        toggleSpotlight,
        orders,
        allOrders,
        getActiveStoreRevenue,
        addOrder,
        updateOrderStatus,
        updateOrderPaymentStatus,
        customers,
        addCustomer,
        staff,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        syncWithD1Database,
        isSyncing,
      }}
    >
      {children}
    </AdminStoreContext.Provider>
  );
};

export const useAdminStore = (): AdminStoreContextType => {
  const context = useContext(AdminStoreContext);
  if (!context) {
    throw new Error("useAdminStore must be used within an AdminStoreProvider");
  }
  return context;
};
