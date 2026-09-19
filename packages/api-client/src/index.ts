import type {
  Garment,
  CreateGarmentInput,
  GarmentStatus,
  ProductColor,
  ProductSize,
  Order,
  CreateOrderInput,
  OrderItem,
  OrderStatus,
  OrderSource,
  Customer,
  CreateCustomerInput,
  StoreLocation,
  CreateStoreInput,
  StaffUser,
  CreateStaffInput,
  UpdateStaffInput,
  StaffRole,
  StaffStatus,
  AuthUser,
  AuthSession,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UpdateCustomerProfileInput,
  PromoValidation,
  ApiResponse,
  StockHealthInfo,
  CanonicalOrderStatus,
  GarmentCategory,
  CustomMeasurements,
  UpdateGarmentInput,
  UpdateOrderStatusInput,
  UpdateStoreInput,
  ValidationResult,
  UpdateStockInput,
  ToggleSpotlightInput,
  CatalogQuery,
  OrderQuery,
  ImageVariant,
  ImageAngles,
  InitializeChapaPaymentInput,
  VerifyChapaPaymentInput,
  ChapaPaymentResult,
  BankAccount,
  CreateBankAccountInput,
  FinancialTransaction,
  BankAccountType,
  OrderTrackingDetails,
  OrderTrackingTimelineEvent,
} from '@astu/shared';
import {
  GARMENT_CATEGORIES,
  z,
  validateData,
  LoginSchema,
  RegisterSchema,
  AuthUserSchema,
  AuthSessionSchema,
  UpdateProfileSchema,
  UpdateCustomerProfileSchema,
  CreateGarmentSchema,
  UpdateGarmentSchema,
  UpdateStockSchema,
  ToggleSpotlightSchema,
  GarmentSchema,
  OrderItemSchema,
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  OrderSchema,
  CreateCustomerSchema,
  CustomerSchema,
  CreateStoreSchema,
  UpdateStoreSchema,
  StoreLocationSchema,
  CreateStaffSchema,
  UpdateStaffSchema,
  StaffUserSchema,
  PromoValidationSchema,
  CatalogQuerySchema,
  OrderQuerySchema,
  ImageAnglesSchema,
  resolveImageUrl,
  InitializeChapaPaymentSchema,
  VerifyChapaPaymentSchema,
  ChapaPaymentResultSchema,
  normalizeEthiopianPhone,
  EthiopianPhoneRegex,
  BankAccountType as BankAccountTypeSchema,
  CreateBankAccountSchema,
  BankAccountSchema,
  FinancialTransactionSchema,
} from '@astu/shared';

export type {
  Garment,
  CreateGarmentInput,
  UpdateGarmentInput,
  GarmentStatus,
  ProductColor,
  ProductSize,
  Order,
  CreateOrderInput,
  OrderItem,
  OrderStatus,
  UpdateOrderStatusInput,
  OrderTrackingDetails,
  OrderTrackingTimelineEvent,
  CanonicalOrderStatus,
  GarmentCategory,
  CustomMeasurements,
  OrderSource,
  Customer,
  CreateCustomerInput,
  StoreLocation,
  CreateStoreInput,
  UpdateStoreInput,
  StaffUser,
  CreateStaffInput,
  UpdateStaffInput,
  StaffRole,
  StaffStatus,
  AuthUser,
  AuthSession,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UpdateCustomerProfileInput,
  PromoValidation,
  ApiResponse,
  StockHealthInfo,
  ValidationResult,
  UpdateStockInput,
  ToggleSpotlightInput,
  CatalogQuery,
  OrderQuery,
  ImageVariant,
  ImageAngles,
  InitializeChapaPaymentInput,
  VerifyChapaPaymentInput,
  ChapaPaymentResult,
  BankAccount,
  CreateBankAccountInput,
  FinancialTransaction,
  BankAccountType,
};

export {
  GARMENT_CATEGORIES,
  z,
  validateData,
  LoginSchema,
  RegisterSchema,
  AuthUserSchema,
  AuthSessionSchema,
  UpdateProfileSchema,
  UpdateCustomerProfileSchema,
  CreateGarmentSchema,
  UpdateGarmentSchema,
  UpdateStockSchema,
  ToggleSpotlightSchema,
  GarmentSchema,
  OrderItemSchema,
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  OrderSchema,
  CreateCustomerSchema,
  CustomerSchema,
  CreateStoreSchema,
  UpdateStoreSchema,
  StoreLocationSchema,
  CreateStaffSchema,
  UpdateStaffSchema,
  StaffUserSchema,
  PromoValidationSchema,
  CatalogQuerySchema,
  OrderQuerySchema,
  ImageAnglesSchema,
  resolveImageUrl,
  InitializeChapaPaymentSchema,
  VerifyChapaPaymentSchema,
  ChapaPaymentResultSchema,
  normalizeEthiopianPhone,
  EthiopianPhoneRegex,
  BankAccountTypeSchema,
  CreateBankAccountSchema,
  BankAccountSchema,
  FinancialTransactionSchema,
};

// ============================================================================
// TOKEN STORAGE PROVIDER INTERFACE
// ============================================================================
export interface TokenStorageProvider {
  getToken(): string | null | Promise<string | null>;
  setToken(token: string | null): void | Promise<void>;
  clearToken(): void | Promise<void>;
}

// ============================================================================
// BACKWARD-COMPATIBILITY TYPE ALIASES
// ============================================================================
export type ApiStoreLocation = StoreLocation;
export type ApiCustomerRecord = Customer;
export type ApiStaffUser = StaffUser;

export interface ApiAuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser | any;
  session?: {
    id: string;
    token: string;
    userId: string;
    expiresAt: string;
  };
  error?: string;
}

export type ApiProductColor = ProductColor;
export type ApiProductSize = ProductSize;
export interface ApiProduct extends Omit<Garment, 'name' | 'title' | 'price' | 'priceEtb'> {
  name: string;
  title: string;
  subtitle: string;
  category: string;
  price: number;
  priceEtb: number;
  priceFormatted: string;
  image: string;
  images?: string[];
  materials?: string[];
  description: string;
  stock: number;
  stockQuantity: number;
  colors?: ApiProductColor[];
  sizes?: ApiProductSize[];
  is_featured?: boolean;
  isFeatured?: boolean;
}
export type ApiOrderSummary = Order & {
  orderNumber?: string;
  paymentStatus?: string;
  placedAt?: string;
  estimatedDelivery?: string | null;
  itemCount?: number;
  title?: string;
  thumbnail?: string;
  totalFormatted?: string;
};
export type ApiPromoValidation = PromoValidation;

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================
export interface ApiClientConfig {
  baseUrl: string;
  storage?: TokenStorageProvider;
  getToken?: () => string | null | Promise<string | null>;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

// ============================================================================
// ASTU GARMENT UNIVERSAL API CLIENT
// ============================================================================
export class AstuApiClient {
  private baseUrl: string;
  private storage?: TokenStorageProvider;
  private getTokenFn?: () => string | null | Promise<string | null>;
  private defaultHeaders: Record<string, string>;
  private timeoutMs: number;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.storage =
      config.storage ||
      (typeof window !== 'undefined'
        ? {
            getToken: () =>
              localStorage.getItem('astu_auth_token') || localStorage.getItem('astu_admin_auth_token'),
            setToken: (token: string | null) => {
              if (token) {
                localStorage.setItem('astu_auth_token', token);
                localStorage.setItem('astu_admin_auth_token', token);
              } else {
                localStorage.removeItem('astu_auth_token');
                localStorage.removeItem('astu_admin_auth_token');
              }
            },
            clearToken: () => {
              localStorage.removeItem('astu_auth_token');
              localStorage.removeItem('astu_admin_auth_token');
            },
          }
        : undefined);
    this.getTokenFn = config.getToken;
    this.defaultHeaders = config.headers || {};
    this.timeoutMs = config.timeoutMs || 10000;
  }

  public async getAuthToken(): Promise<string | null> {
    if (this.storage) {
      const token = await this.storage.getToken();
      if (token) return token;
    }
    if (this.getTokenFn) {
      const token = await this.getTokenFn();
      if (token) return token;
    }
    return null;
  }

  public async setAuthToken(token: string | null): Promise<void> {
    if (this.storage) {
      await this.storage.setToken(token);
    }
  }

  public async clearAuthToken(): Promise<void> {
    if (this.storage) {
      await this.storage.clearToken();
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...this.defaultHeaders,
        ...(options.headers as Record<string, string>),
      };

      const token = await this.getAuthToken();
      if (token) {
        if (token.includes('=')) {
          const sessionMatch = token.match(/better-auth\.session_token=([^;]+)/);
          if (sessionMatch && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${sessionMatch[1]}`;
          }
        } else {
          if (!headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }
      }

      const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
      const fetchOptions: RequestInit = {
        ...options,
        headers,
        signal: controller?.signal,
      };
      if (isBrowser) {
        fetchOptions.credentials = 'include';
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);

      if (timeoutId) clearTimeout(timeoutId);

      // Auto-extract session tokens from response headers if set-auth-token or x-auth-token is present
      const tokenHeader = response.headers.get('set-auth-token') || response.headers.get('x-auth-token');
      if (tokenHeader && this.storage) {
        const cleanToken = tokenHeader.startsWith('Bearer ') ? tokenHeader.slice(7) : tokenHeader;
        await this.storage.setToken(cleanToken);
      }

      const responseText = await response.text();
      let json: any = {};
      if (responseText && responseText.trim().length > 0) {
        try {
          json = JSON.parse(responseText);
        } catch {
          json = { error: responseText };
        }
      }

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error:
            (json as { error?: string; message?: string })?.message ||
            (json as { error?: string })?.error ||
            `HTTP ${response.status}`,
        };
      }

      // Auto-unwrap backend { success: true, data: T } structure so res.data is directly the expected payload
      let payloadData: any = json;
      if (json && typeof json === 'object' && 'data' in json && ('success' in json || 'statusCode' in json)) {
        payloadData = json.data;
      }

      return {
        success: true,
        statusCode: response.status,
        data: payloadData as T,
      };
    } catch (err: unknown) {
      if (timeoutId) clearTimeout(timeoutId);
      return {
        success: false,
        statusCode: 0,
        error: err instanceof Error ? err.message : 'Network error',
      };
    }
  }

  // ==========================================================================
  // Health
  // ==========================================================================
  async getHealth(): Promise<ApiResponse<{ status: string; service: string; database: string }>> {
    return this.request<{ status: string; service: string; database: string }>('/api/health');
  }

  // ==========================================================================
  // Auth / Identity
  // ==========================================================================
  async signIn(
    emailOrData: string | LoginInput,
    passwordArg?: string
  ): Promise<ApiResponse<ApiAuthResponse>> {
    const payload =
      typeof emailOrData === 'object'
        ? emailOrData
        : { email: emailOrData, password: passwordArg || '' };

    let res = await this.request<ApiAuthResponse>('/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success && res.statusCode === 404) {
      res = await this.request<ApiAuthResponse>('/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    if (res.success && res.data) {
      const token = res.data.token || res.data.session?.token;
      if (token && this.storage) {
        await this.storage.setToken(token);
      }
    }

    return res;
  }

  async signUp(
    data: RegisterInput | { name: string; email: string; password: string; phone?: string; role?: string }
  ): Promise<ApiResponse<ApiAuthResponse>> {
    let res = await this.request<ApiAuthResponse>('/api/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!res.success && res.statusCode === 404) {
      res = await this.request<ApiAuthResponse>('/api/auth/sign-up/email', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }

    if (res.success && res.data) {
      const token = res.data.token || res.data.session?.token;
      if (token && this.storage) {
        await this.storage.setToken(token);
      }
    }

    return res;
  }

  async signOut(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      await this.request<{ success: boolean }>('/api/auth/sign-out', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } catch {
      // Ignore network error on logout
    } finally {
      if (this.storage) {
        await this.storage.clearToken();
      }
    }
    return { success: true, statusCode: 200, data: { success: true } };
  }

  async getMe(): Promise<ApiResponse<{ authenticated: boolean; user?: any }>> {
    return this.request<{ authenticated: boolean; user?: any }>('/api/me');
  }

  async getSession(): Promise<ApiResponse<AuthSession | null>> {
    const token = await this.getAuthToken();
    if (!token) {
      return { success: true, statusCode: 200, data: null };
    }

    // 1. Validate against /api/me (D1 sessions & active status)
    const meRes = await this.request<{ authenticated: boolean; user: AuthUser }>('/api/me');
    if (meRes.success && meRes.data?.authenticated && meRes.data.user) {
      return {
        success: true,
        statusCode: 200,
        data: {
          user: meRes.data.user,
          token,
        },
      };
    }

    // If 401 unauthenticated, clear revoked/expired token
    if (meRes.statusCode === 401 || (meRes.error && meRes.error.toLowerCase().includes('401'))) {
      if (this.storage) {
        await this.storage.clearToken();
      }
      return { success: false, statusCode: 401, error: 'Session expired', data: null };
    }

    // 2. Fallback to /api/auth/get-session
    const sessRes = await this.request<AuthSession | null>('/api/auth/get-session');
    if (sessRes.success && sessRes.data?.user) {
      return {
        success: true,
        statusCode: 200,
        data: sessRes.data,
      };
    }

    return { success: true, statusCode: 200, data: null };
  }

  async updateProfile(
    input: UpdateProfileInput
  ): Promise<ApiResponse<{ success: boolean; user?: any; error?: string }>> {
    return this.request<{ success: boolean; user?: any; error?: string }>('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async updateCustomerProfile(
    input: UpdateCustomerProfileInput
  ): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    return this.request<{ success: boolean; message?: string }>('/api/customer/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  // ==========================================================================
  // Garments / Products Catalog
  // ==========================================================================
  async listGarments(params?: {
    category?: string;
    search?: string;
    storeId?: string;
  }): Promise<ApiResponse<Garment[]>> {
    let endpoint = '/api/garments';
    if (params) {
      const query = new URLSearchParams();
      if (params.category) query.set('category', params.category);
      if (params.search) query.set('search', params.search);
      if (params.storeId) query.set('storeId', params.storeId);
      const qs = query.toString();
      if (qs) endpoint += `?${qs}`;
    }
    return this.request<Garment[]>(endpoint);
  }

  async getGarment(id: string): Promise<ApiResponse<Garment>> {
    return this.request<Garment>(`/api/garments/${encodeURIComponent(id)}`);
  }

  async createGarment(input: CreateGarmentInput): Promise<ApiResponse<Garment>> {
    const check = validateData(CreateGarmentSchema, input);
    if (!check.success) {
      return {
        success: false,
        error: check.error,
        fieldErrors: check.fieldErrors,
        statusCode: 400,
      };
    }
    return this.request<Garment>('/api/garments', {
      method: 'POST',
      body: JSON.stringify(check.data),
    });
  }

  async updateStock(
    id: string,
    newStockQuantity: number,
    newInitialStock?: number
  ): Promise<ApiResponse<Garment>> {
    const check = validateData(UpdateStockSchema, {
      stockQuantity: newStockQuantity,
      initialStock: newInitialStock,
    });
    if (!check.success) {
      return {
        success: false,
        error: check.error,
        fieldErrors: check.fieldErrors,
        statusCode: 400,
      };
    }
    return this.request<Garment>(`/api/garments/${encodeURIComponent(id)}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(check.data),
    });
  }

  async toggleSpotlight(
    id: string,
    isFeatured?: boolean
  ): Promise<ApiResponse<{ success: boolean; isFeatured: boolean; id: string }>> {
    return this.request<{ success: boolean; isFeatured: boolean; id: string }>(
      `/api/garments/${encodeURIComponent(id)}/spotlight`,
      {
        method: 'PATCH',
        body: isFeatured !== undefined ? JSON.stringify({ isFeatured }) : undefined,
      }
    );
  }

  async clearAllGarments(): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    return this.request<{ success: boolean; message?: string }>('/api/garments', {
      method: 'DELETE',
    });
  }

  async deleteGarment(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/api/garments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // Orders & Fulfillment Pipeline
  // ==========================================================================
  async listOrders(params?: {
    email?: string;
    storeId?: string;
    status?: string;
    trackingNumber?: string;
    query?: string;
    q?: string;
  }): Promise<ApiResponse<Order[]>> {
    let endpoint = '/api/orders';
    const query = new URLSearchParams();
    if (params?.email) query.set('email', params.email);
    if (params?.storeId) query.set('storeId', params.storeId);
    if (params?.status) query.set('status', params.status);
    if (params?.trackingNumber) query.set('trackingNumber', params.trackingNumber);
    if (params?.query) query.set('query', params.query);
    if (params?.q) query.set('q', params.q);
    const qs = query.toString();
    if (qs) endpoint += `?${qs}`;
    return this.request<Order[]>(endpoint);
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/api/orders/${encodeURIComponent(id)}`);
  }

  async trackOrder(trackingNumberOrId: string): Promise<ApiResponse<OrderTrackingDetails>> {
    return this.request<OrderTrackingDetails>(`/api/orders/track/${encodeURIComponent(trackingNumberOrId.trim())}`);
  }

  async createOrder(input: CreateOrderInput | any): Promise<ApiResponse<Order>> {
    const check = validateData(CreateOrderSchema, input);
    if (!check.success) {
      return {
        success: false,
        error: check.error,
        fieldErrors: check.fieldErrors,
        statusCode: 400,
      };
    }
    return this.request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(check.data),
    });
  }

  async updateOrderStatus(id: string, status?: string, paymentStatus?: string): Promise<ApiResponse<Order>> {
    const payload: any = {};
    if (status) payload.status = status;
    if (paymentStatus) payload.paymentStatus = paymentStatus;
    const check = validateData(UpdateOrderStatusSchema, payload);
    if (!check.success) {
      return {
        success: false,
        error: check.error,
        fieldErrors: check.fieldErrors,
        statusCode: 400,
      };
    }
    return this.request<Order>(`/api/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(check.data),
    });
  }

  async confirmOrderReceipt(id: string, email?: string): Promise<ApiResponse<{ success: boolean; order?: Order }>> {
    return this.request<{ success: boolean; order?: Order }>(`/api/orders/${encodeURIComponent(id)}/confirm-receipt`, {
      method: 'POST',
      body: email ? JSON.stringify({ email }) : undefined,
    });
  }

  // ==========================================================================
  // Chapa Payment Gateway
  // ==========================================================================
  async initializeChapaPayment(
    input: InitializeChapaPaymentInput
  ): Promise<ApiResponse<ChapaPaymentResult>> {
    const check = validateData(InitializeChapaPaymentSchema, input);
    if (!check.success) {
      return {
        success: false,
        error: check.error,
        fieldErrors: check.fieldErrors,
        statusCode: 400,
      };
    }
    const res = await this.request<any>('/api/payments/chapa/initialize', {
      method: 'POST',
      body: JSON.stringify(check.data),
    });

    if (!res.success || !res.data) {
      return res;
    }

    const unwrapped: ChapaPaymentResult = {
      checkoutUrl: res.data.checkoutUrl || res.data.data?.checkoutUrl,
      txRef: res.data.txRef || res.data.data?.txRef,
      orderId: res.data.orderId || res.data.data?.orderId,
    };

    return {
      ...res,
      data: unwrapped,
    };
  }

  async verifyChapaPayment(
    input: VerifyChapaPaymentInput
  ): Promise<ApiResponse<{ status: string; order?: Order; chapa?: any }>> {
    const check = validateData(VerifyChapaPaymentSchema, input);
    if (!check.success) {
      return {
        success: false,
        error: check.error,
        fieldErrors: check.fieldErrors,
        statusCode: 400,
      };
    }
    return this.request<{ status: string; order?: Order; chapa?: any }>(
      '/api/payments/chapa/verify',
      {
        method: 'POST',
        body: JSON.stringify(check.data),
      }
    );
  }

  // ==========================================================================
  // Customers Directory
  // ==========================================================================
  async listCustomers(): Promise<ApiResponse<Customer[]>> {
    return this.request<Customer[]>('/api/customers');
  }

  async createCustomer(
    input: CreateCustomerInput | { name: string; email: string; phone?: string }
  ): Promise<ApiResponse<Customer>> {
    const check = validateData(CreateCustomerSchema, input);
    if (!check.success) {
      return {
        success: false,
        error: check.error,
        fieldErrors: check.fieldErrors,
        statusCode: 400,
      };
    }
    return this.request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(check.data),
    });
  }

  // ==========================================================================
  // Stores Locations
  // ==========================================================================
  async listStores(): Promise<ApiResponse<StoreLocation[]>> {
    return this.request<StoreLocation[]>('/api/stores');
  }

  async createStore(
    nameOrInput: string | CreateStoreInput,
    locationArg?: string
  ): Promise<ApiResponse<StoreLocation>> {
    const payload =
      typeof nameOrInput === 'object'
        ? nameOrInput
        : { name: nameOrInput, location: locationArg || '' };

    const check = validateData(CreateStoreSchema, payload);
    if (!check.success) {
      return {
        success: false,
        error: check.error,
        fieldErrors: check.fieldErrors,
        statusCode: 400,
      };
    }
    return this.request<StoreLocation>('/api/stores', {
      method: 'POST',
      body: JSON.stringify(check.data),
    });
  }

  async updateStore(
    id: string,
    input: Partial<CreateStoreInput>
  ): Promise<ApiResponse<StoreLocation>> {
    return this.request<StoreLocation>(`/api/stores/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteStore(id: string): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    return this.request<{ success: boolean; message?: string }>(`/api/stores/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // Staff & Team Management
  // ==========================================================================
  async listStaff(): Promise<ApiResponse<StaffUser[]>> {
    return this.request<StaffUser[]>('/api/staff');
  }

  async createStaff(
    input:
      | CreateStaffInput
      | string
      | { name: string; email: string; password?: string; role?: string; status?: string },
    emailArg?: string,
    passwordArg?: string,
    roleArg?: string
  ): Promise<ApiResponse<StaffUser>> {
    const payload =
      typeof input === 'object'
        ? input
        : {
            name: input,
            email: emailArg || '',
            password: passwordArg || 'admin123',
            role: roleArg || 'Operator',
          };

    return this.request<StaffUser>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateStaff(
    id: string,
    input: UpdateStaffInput | { name?: string; role?: string; status?: string; password?: string }
  ): Promise<ApiResponse<{ success: boolean; staff?: StaffUser }>> {
    return this.request<{ success: boolean; staff?: StaffUser }>(`/api/staff/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteStaff(id: string): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    return this.request<{ success: boolean; message?: string }>(`/api/staff/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // Promo Validation
  // ==========================================================================
  async validatePromo(code: string, subtotal?: number): Promise<ApiResponse<PromoValidation>> {
    const norm = code.trim().toUpperCase();
    if (norm === 'ASTU10' || norm === 'MATIF10') {
      const base = subtotal && subtotal > 0 ? subtotal : 4500;
      const discount = Math.round(base * 0.1);
      return {
        success: true,
        statusCode: 200,
        data: {
          valid: true,
          code: 'ASTU10',
          description: '10% off ASTU Garment order',
          kind: 'Percentage',
          value: '10%',
          discountCents: discount,
          discountFormatted: `ETB ${discount.toLocaleString()}`,
        },
      };
    }
    return {
      success: false,
      statusCode: 400,
      error: 'Invalid promo code',
      data: {
        valid: false,
        code,
        description: 'Promo code is not recognized',
        kind: 'Percentage',
        value: '0%',
        discountCents: 0,
        discountFormatted: 'ETB 0',
      },
    };
  }

  // ==========================================================================
  // R2 Asset Uploads
  // ==========================================================================
  async uploadAssetVariant(
    imageId: string,
    variant: ImageVariant,
    blob: Blob
  ): Promise<ApiResponse<{ success: boolean; imageId: string; variant: string; key: string; url: string }>> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'image/webp',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/upload/${encodeURIComponent(imageId)}/${encodeURIComponent(variant)}`, {
        method: 'PUT',
        headers,
        body: blob,
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          statusCode: res.status,
          error: (json as any)?.error || `Upload failed with status ${res.status}`,
        };
      }
      return {
        success: true,
        statusCode: res.status,
        data: json as any,
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        error: err?.message || 'Network error during asset upload',
      };
    }
  }

  async uploadImageCluster(
    imageId: string,
    variants: { thumb: Blob; preview: Blob; full: Blob }
  ): Promise<ApiResponse<{ imageId: string; urls: { thumb: string; preview: string; full: string } }>> {
    const results = await Promise.all([
      this.uploadAssetVariant(imageId, 'thumb', variants.thumb),
      this.uploadAssetVariant(imageId, 'preview', variants.preview),
      this.uploadAssetVariant(imageId, 'full', variants.full),
    ]);

    const failed = results.find((r) => !r.success);
    if (failed) {
      return {
        success: false,
        error: failed.error || 'Failed to upload one or more image variants',
      };
    }

    return {
      success: true,
      data: {
        imageId,
        urls: {
          thumb: resolveImageUrl(imageId, 'thumb', this.baseUrl),
          preview: resolveImageUrl(imageId, 'preview', this.baseUrl),
          full: resolveImageUrl(imageId, 'full', this.baseUrl),
        },
      },
    };
  }

  // ============================================================================
  // ERP: SUPPLIERS
  // ============================================================================
  async listSuppliers(): Promise<ApiResponse<any[]>> {
    return this.request('/api/suppliers');
  }

  async getSupplier(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/suppliers/${id}`);
  }

  async createSupplier(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/suppliers', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateSupplier(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/api/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async deleteSupplier(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/suppliers/${id}`, { method: 'DELETE' });
  }

  // ============================================================================
  // ERP: PURCHASE ORDERS
  // ============================================================================
  async listPurchases(): Promise<ApiResponse<any[]>> {
    return this.request('/api/purchases');
  }

  async getPurchase(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/purchases/${id}`);
  }

  async createPurchase(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/purchases', { method: 'POST', body: JSON.stringify(data) });
  }

  async updatePurchaseStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/api/purchases/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }

  async receivePurchase(id: string, data?: { accountId?: string; warehouseId?: string; payNow?: boolean }): Promise<ApiResponse<any>> {
    return this.request(`/api/purchases/${id}/receive`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // ============================================================================
  // ERP: WAREHOUSES & INVENTORY
  // ============================================================================
  async listWarehouses(): Promise<ApiResponse<any[]>> {
    return this.request('/api/warehouses');
  }

  async getWarehouse(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/warehouses/${id}`);
  }

  async createWarehouse(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/warehouses', { method: 'POST', body: JSON.stringify(data) });
  }

  async listWarehouseItems(params?: {
    warehouseId?: string;
    category?: string;
    availableOnly?: boolean;
    search?: string;
  }): Promise<ApiResponse<any[]>> {
    const query = new URLSearchParams();
    if (params?.warehouseId) query.set('warehouseId', params.warehouseId);
    if (params?.category) query.set('category', params.category);
    if (params?.availableOnly !== undefined) query.set('availableOnly', String(params.availableOnly));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return this.request(`/api/warehouses/items${qs ? `?${qs}` : ''}`);
  }

  async getWarehouseItem(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/warehouses/items/${id}`);
  }

  async transferWarehouseItemToProduction(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/warehouses/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // ERP: EXPENSES
  // ============================================================================
  async listExpenses(params?: { category?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<any[]>> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const qs = query.toString();
    return this.request(`/api/expenses${qs ? `?${qs}` : ''}`);
  }

  async getExpenseSummary(): Promise<ApiResponse<any>> {
    return this.request('/api/expenses/summary');
  }

  async createExpense(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/expenses', { method: 'POST', body: JSON.stringify(data) });
  }

  async deleteExpense(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/expenses/${id}`, { method: 'DELETE' });
  }

  // ============================================================================
  // ERP: SHIPMENTS
  // ============================================================================
  async listShipments(): Promise<ApiResponse<any[]>> {
    return this.request('/api/shipments');
  }

  async getShipment(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/shipments/${id}`);
  }

  async createShipment(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/shipments', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateShipment(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/api/shipments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  // ============================================================================
  // ERP: FINANCE & BANKING
  // ============================================================================
  async getFinanceDashboard(): Promise<ApiResponse<any>> {
    return this.request('/api/finance/dashboard');
  }

  async getProfitLoss(startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const query = new URLSearchParams();
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);
    const qs = query.toString();
    return this.request(`/api/finance/profit-loss${qs ? `?${qs}` : ''}`);
  }

  async listBankAccounts(): Promise<ApiResponse<BankAccount[]>> {
    return this.request('/api/finance/accounts');
  }

  async createBankAccount(data: CreateBankAccountInput): Promise<ApiResponse<BankAccount>> {
    return this.request('/api/finance/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async depositToAccount(
    accountId: string,
    data: { amountEtb: number; description: string; category?: string; date?: string }
  ): Promise<ApiResponse<FinancialTransaction>> {
    return this.request(`/api/finance/accounts/${encodeURIComponent(accountId)}/deposit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async transferFunds(data: {
    fromAccountId: string;
    toAccountId: string;
    amountEtb: number;
    description?: string;
    date?: string;
  }): Promise<ApiResponse<{ fromAccount: BankAccount; toAccount: BankAccount }>> {
    return this.request('/api/finance/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFinancialTransactions(limit = 100): Promise<ApiResponse<FinancialTransaction[]>> {
    return this.request(`/api/finance/transactions?limit=${limit}`);
  }
}

// ============================================================================
// FACTORY FUNCTION & COMPATIBILITY ALIASES
// ============================================================================
export const MatifApiClient = AstuApiClient;
export type MatifApiClient = AstuApiClient;

export function createApiClient(config: ApiClientConfig): AstuApiClient {
  return new AstuApiClient(config);
}
