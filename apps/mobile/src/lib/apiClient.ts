import {
  createApiClient,
  AstuApiClient,
  MatifApiClient,
  type TokenStorageProvider,
  type ApiClientConfig,
  type ApiProduct,
  type ApiOrderSummary,
  type ApiPromoValidation,
  type ApiProductColor,
  type ApiProductSize,
  type ApiAuthResponse,
  type Garment,
  type CreateGarmentInput,
  type Order,
  type CreateOrderInput,
  type OrderItem,
  type AuthUser,
  type AuthSession,
  type LoginInput,
  type RegisterInput,
  type UpdateProfileInput,
  type UpdateCustomerProfileInput,
  type PromoValidation,
  type ApiResponse,
  type InitializeChapaPaymentInput,
  type VerifyChapaPaymentInput,
  type ChapaPaymentResult,
  normalizeEthiopianPhone,
  EthiopianPhoneRegex,
} from '@astu/api-client';
import { resolveImageUrl, setAssetsBaseUrl } from '@astu/shared';
import { authClient, API_BASE_URL } from './auth-client';
import { getStoredToken, setStoredToken, getCachedToken } from './storage';

// Initialize shared assets base URL with production worker URL
if (API_BASE_URL) {
  setAssetsBaseUrl(API_BASE_URL);
}

export { API_BASE_URL };

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// ============================================================================
// TOKEN STORAGE ADAPTER (expo-secure-store + AsyncStorage + Better Auth)
// ============================================================================
export const mobileTokenStorage: TokenStorageProvider = {
  getToken: async (): Promise<string | null> => {
    try {
      const cookie = await (authClient as any).getCookie?.();
      if (cookie) return cookie;
    } catch {}
    const cached = getCachedToken();
    if (cached) return cached;
    return await getStoredToken();
  },
  setToken: async (token: string | null): Promise<void> => {
    await setStoredToken(token);
  },
  clearToken: async (): Promise<void> => {
    await setStoredToken(null);
  },
};

// ============================================================================
// INSTANTIATE UNIVERSAL MOBILE API CLIENT
// ============================================================================
export const apiClient: AstuApiClient = createApiClient({
  baseUrl: API_BASE_URL,
  storage: mobileTokenStorage,
  timeoutMs: 12000,
});

// ============================================================================
// COMPATIBILITY TYPES & MODELS
// ============================================================================
export interface ApiCartItem {
  id: string;
  productId: string;
  size: string | null;
  colorName: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    priceFormatted: string;
    image: string;
  };
}

export interface ApiWishlistItem {
  id: string;
  productId: string;
  size: string | null;
  colorName: string | null;
  variantLabel: string;
  product: {
    id: string;
    name: string;
    price: number;
    priceFormatted: string;
    image: string;
  };
}

export interface ApiOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  placedAt: string;
  estimatedDelivery: string | null;
  itemCount: number;
  title: string;
  thumbnail: string;
  totalFormatted: string;
  items: {
    productId: string;
    name: string;
    image: string;
    colorName: string | null;
    size: string | null;
    unitPriceFormatted: string;
    quantity: number;
  }[];
  events?: {
    position: number;
    label: string;
    detail: string | null;
    state: 'done' | 'active' | 'pending';
    occurredAt: string | null;
  }[];
  totals?: {
    subtotalFormatted: string;
    shippingFormatted: string;
    taxFormatted: string;
    discountFormatted: string;
    totalFormatted: string;
  };
  promoCode?: string | null;
  address?: {
    name: string;
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
}

// ============================================================================
// HELPER TRANSFORMERS FOR MOBILE SCREENS
// ============================================================================
export function mapGarmentToProduct(g: Garment): ApiProduct {
  const priceEtb = g.priceEtb ?? g.price ?? 0;

  // Resolve primary front image ID or URL
  let primaryFrontId: string | undefined;
  if (Array.isArray(g.colors) && g.colors.length > 0) {
    const firstC = g.colors[0];
    if (firstC && typeof firstC === 'object' && (firstC as any).images?.front) {
      primaryFrontId = (firstC as any).images.front;
    }
  }
  if (!primaryFrontId && g.imageUrl) {
    primaryFrontId = g.imageUrl;
  }
  if (!primaryFrontId && Array.isArray(g.images) && g.images.length > 0) {
    primaryFrontId = g.images[0];
  }

  const resolvedFrontPreview = resolveImageUrl(primaryFrontId, 'preview', API_BASE_URL);

  const colorName =
    g.color ||
    (g.colors && g.colors.length > 0
      ? typeof g.colors[0] === 'string'
        ? g.colors[0]
        : (g.colors[0] as any)?.name
      : 'Standard');
  const sizeLabel =
    g.size ||
    (g.sizes && g.sizes.length > 0
      ? typeof g.sizes[0] === 'string'
        ? g.sizes[0]
        : (g.sizes[0] as any)?.label
      : 'M');
  const isFeatured = Boolean(g.is_featured ?? g.isFeatured ?? false);
  const pName = g.title || g.name || 'Handcrafted Garment';

  const mappedColors =
    g.colors && g.colors.length > 0
      ? g.colors.map((c: any) =>
          typeof c === 'string' ? { name: c, hex: '#845400' } : c
        )
      : [{ name: colorName, hex: '#845400' }];

  const mappedImages =
    g.images && g.images.length > 0
      ? g.images.map((img) => resolveImageUrl(img, 'preview', API_BASE_URL))
      : [resolvedFrontPreview];

  return {
    ...g,
    id: g.id,
    sku: g.sku,
    name: pName,
    title: pName,
    subtitle: `${(g.category || 'rtw').toUpperCase()} Collection`,
    category: g.category || 'rtw',
    price: priceEtb,
    priceEtb: priceEtb,
    priceFormatted: `ETB ${priceEtb.toLocaleString()}`,
    image: resolvedFrontPreview,
    imageUrl: resolvedFrontPreview,
    images: mappedImages,
    description: g.description || g.notes || 'Handcrafted Ethiopian woven garment.',
    stock: g.stockQuantity ?? g.quantity ?? 10,
    stockQuantity: g.stockQuantity ?? g.quantity ?? 10,
    colors: mappedColors,
    sizes:
      g.sizes && g.sizes.length > 0
        ? g.sizes.map((s: any) =>
            typeof s === 'string' ? { label: s, available: true } : s
          )
        : [{ label: sizeLabel, available: true }],
    is_featured: isFeatured,
    isFeatured: isFeatured,
  };
}

export type {
  AstuApiClient,
  MatifApiClient,
  ApiClientConfig,
  TokenStorageProvider,
  ApiProduct,
  ApiOrderSummary,
  ApiPromoValidation,
  ApiProductColor,
  ApiProductSize,
  ApiAuthResponse,
  Garment,
  CreateGarmentInput,
  Order,
  CreateOrderInput,
  OrderItem,
  AuthUser,
  AuthSession,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  UpdateCustomerProfileInput,
  PromoValidation,
  ApiResponse,
  InitializeChapaPaymentInput,
  VerifyChapaPaymentInput,
  ChapaPaymentResult,
};

export { createApiClient, normalizeEthiopianPhone, EthiopianPhoneRegex };
