import { z } from 'zod';

// Re-export z so all consumers have direct access to Zod
export { z };

// ============================================================================
// 1. ROLES & STATUS ENUMS
// ============================================================================
export const UserRole = z.enum([
  'admin',
  'manager',
  'operator',
  'owner',
  'customer',
  'Admin',
  'Manager',
  'Operator',
  'Owner',
  'Customer',
]);
export type UserRole = z.infer<typeof UserRole>;

export const StaffRole = z.enum([
  'Admin',
  'Manager',
  'Operator',
  'Owner',
  'admin',
  'manager',
  'operator',
  'owner',
]);
export type StaffRole = z.infer<typeof StaffRole>;

export const StaffStatus = z.enum(['Active', 'Inactive', 'active', 'inactive']);
export type StaffStatus = z.infer<typeof StaffStatus>;

export const GarmentStatus = z.enum(['draft', 'in_production', 'quality_check', 'completed', 'archived']);
export type GarmentStatus = z.infer<typeof GarmentStatus>;

export const OrderStatus = z.enum([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'in_production',
  'quality_check',
  'completed',
  'draft',
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const CanonicalOrderStatus = z.enum([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);
export type CanonicalOrderStatus = z.infer<typeof CanonicalOrderStatus>;

export const GarmentCategory = z.enum([
  'rtw',
  'traditional',
  'outerwear',
  'accessories',
  'footwear',
]);
export type GarmentCategory = z.infer<typeof GarmentCategory>;

export const GARMENT_CATEGORIES = [
  { id: 'all', name: 'All Pieces' },
  { id: 'rtw', name: 'Ready-to-Wear' },
  { id: 'traditional', name: 'Traditional & Kemis' },
  { id: 'outerwear', name: 'Outerwear & Jackets' },
  { id: 'accessories', name: 'Accessories & Scarves' },
  { id: 'footwear', name: 'Footwear & Shoes' },
] as const;

export const CustomMeasurementsSchema = z.object({
  height: z.string().optional(),
  chest: z.string().optional(),
  waist: z.string().optional(),
  length: z.string().optional(),
  hips: z.string().optional(),
  shoulders: z.string().optional(),
  notes: z.string().optional(),
});
export type CustomMeasurements = z.infer<typeof CustomMeasurementsSchema>;

export const OrderSource = z.enum(['app', 'phone', 'web', 'pos']);
export type OrderSource = z.infer<typeof OrderSource>;

// ============================================================================
// 2. AUTHENTICATION & IDENTITY SCHEMAS
// ============================================================================
export const LoginSchema = z.object({
  email: z.string().email('A valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('A valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.string().optional().default('customer'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  avatarUrl: z.string().optional(),
  tier: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthSessionSchema = z.object({
  user: AuthUserSchema,
  session: z
    .object({
      id: z.string(),
      token: z.string(),
      userId: z.string(),
      expiresAt: z.string(),
    })
    .optional(),
  token: z.string().optional(),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

export const UpdateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email('A valid email address is required').optional(),
  oldPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const UpdateCustomerProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('A valid email address is required').optional(),
});
export type UpdateCustomerProfileInput = z.infer<typeof UpdateCustomerProfileSchema>;

// ============================================================================
// 3. GARMENT & CATALOG SCHEMAS
// ============================================================================
export const ImageVariant = z.enum(['thumb', 'preview', 'full']);
export type ImageVariant = z.infer<typeof ImageVariant>;

export const ImageAnglesSchema = z.object({
  front: z.string().min(1, 'Front angle image is required'),
  back: z.string().optional(),
  side: z.string().optional(),
});
export type ImageAngles = z.infer<typeof ImageAnglesSchema>;

export const ProductColorSchema = z.object({
  name: z.string().min(1, 'Color name is required'),
  hex: z.string().min(1, 'Hex color code is required'),
  images: ImageAnglesSchema.optional(),
});
export type ProductColor = z.infer<typeof ProductColorSchema>;

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80';

let _customAssetsBaseUrl: string | null = null;

export function setAssetsBaseUrl(url: string | null | undefined): void {
  if (url && typeof url === 'string' && url.trim().length > 0) {
    const clean = url.trim().replace(/\/$/, '');
    _customAssetsBaseUrl = clean.endsWith('/api/assets') ? clean : `${clean}/api/assets`;
  } else {
    _customAssetsBaseUrl = null;
  }
}

export function getAssetsBaseUrl(): string {
  if (_customAssetsBaseUrl) return _customAssetsBaseUrl;

  // Browser environment
  if (typeof globalThis !== 'undefined' && (globalThis as any).window?.location?.origin) {
    return `${(globalThis as any).window.location.origin}/api/assets`;
  }

  return 'http://localhost:8787/api/assets';
}

/**
 * Resolves an image ID, R2 key, or existing URL to a full CDN/proxy URL.
 * Prevents double-nesting prefixes and ensures R2 images are displayed reliably.
 */
export function resolveImageUrl(
  imageIdOrUrl: string | undefined | null,
  variant: ImageVariant = 'preview',
  baseUrl?: string
): string {
  if (!imageIdOrUrl || typeof imageIdOrUrl !== 'string' || imageIdOrUrl.trim().length === 0) {
    return '';
  }

  const trimmed = imageIdOrUrl.trim();

  // Data URLs or Object URLs (e.g. during client-side preview upload)
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const base = baseUrl
    ? (baseUrl.endsWith('/api/assets') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/api/assets`)
    : getAssetsBaseUrl();
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;

  // Already a proxy or relative asset URL (e.g. /api/assets/..., /api/storage/..., /api/r2/...)
  if (trimmed.startsWith('/api/assets/') || trimmed.startsWith('/api/storage/') || trimmed.startsWith('/api/r2/')) {
    if (baseUrl && !trimmed.startsWith(cleanBase)) {
      const cleanRoot = cleanBase.replace(/\/api\/assets$/, '');
      return `${cleanRoot}${trimmed}`;
    }
    return trimmed;
  }

  // Full HTTP/HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it points to localhost:8787/api/assets, rewrite it to active cleanBase
    if (trimmed.startsWith('http://localhost:8787/api/assets') && cleanBase !== 'http://localhost:8787/api/assets') {
      return trimmed.replace('http://localhost:8787/api/assets', cleanBase);
    }
    // If it points to an R2 domain (e.g. *.r2.dev), route through proxy to bypass private bucket restrictions
    if (trimmed.includes('.r2.dev/') || trimmed.includes('.r2.cloudflarestorage.com/')) {
      return `${cleanBase}/proxy?url=${encodeURIComponent(trimmed)}`;
    }
    return trimmed;
  }

  // If already prefixed with 'products/'
  if (trimmed.startsWith('products/')) {
    // If it already has an extension like .webp or .png
    if (/\.[a-zA-Z0-9]+$/i.test(trimmed)) {
      return `${cleanBase}/${trimmed}`;
    }
    return `${cleanBase}/${trimmed}/${variant}.webp`;
  }

  // If path contains other storage prefixes or already has a file extension
  if (trimmed.startsWith('storage/') || trimmed.startsWith('r2/') || trimmed.startsWith('uploads/')) {
    return `${cleanBase}/${trimmed}`;
  }

  if (/\.[a-zA-Z0-9]+$/i.test(trimmed)) {
    return `${cleanBase}/${trimmed}`;
  }

  // Standard Image ID: /api/assets/products/:imageId/:variant.webp
  return `${cleanBase}/products/${trimmed}/${variant}.webp`;
}

/**
 * Explicitly constructs an R2 storage display proxy URL
 */
export function resolveR2ProxyUrl(
  keyOrUrl: string | undefined | null,
  variant?: ImageVariant,
  baseUrl?: string
): string {
  if (!keyOrUrl || typeof keyOrUrl !== 'string' || keyOrUrl.trim().length === 0) {
    return '';
  }

  const base = baseUrl
    ? (baseUrl.endsWith('/api/assets') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/api/assets`)
    : getAssetsBaseUrl();
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;

  const trimmed = keyOrUrl.trim();
  const variantParam = variant ? `&variant=${variant}` : '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return `${cleanBase}/proxy?url=${encodeURIComponent(trimmed)}${variantParam}`;
  }

  return `${cleanBase}/proxy?key=${encodeURIComponent(trimmed)}${variantParam}`;
}

export const ProductSizeSchema = z.object({
  label: z.string().min(1, 'Size label is required'),
  available: z.boolean().default(true),
});
export type ProductSize = z.infer<typeof ProductSizeSchema>;

export const CreateGarmentSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().optional(),
  title: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  storeId: z.string().nullable().optional(),
  price: z.number().nonnegative().optional(),
  priceEtb: z.number().nonnegative().optional(),
  buyingPrice: z.number().nonnegative().nullable().optional(),
  buyingPriceEtb: z.number().nonnegative().nullable().optional(),
  profitMargin: z.number().nullable().optional(),
  quantity: z.number().int().nonnegative().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  initialStock: z.number().int().nonnegative().optional(),
  status: GarmentStatus.default('draft'),
  color: z.string().optional(),
  size: z.string().optional(),
  colors: z.array(z.union([z.string(), ProductColorSchema])).optional(),
  sizes: z.array(z.union([z.string(), ProductSizeSchema])).optional(),
  materials: z.array(z.string()).optional(),
  material: z.string().optional(),
  images: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  notes: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  tag: z.string().nullable().optional(),
});
export type CreateGarmentInput = z.infer<typeof CreateGarmentSchema>;

export const UpdateGarmentSchema = CreateGarmentSchema.partial();
export type UpdateGarmentInput = z.infer<typeof UpdateGarmentSchema>;

export const UpdateStockSchema = z.object({
  stockQuantity: z.coerce.number().int().nonnegative().optional(),
  quantity: z.coerce.number().int().nonnegative().optional(),
  initialStock: z.coerce.number().int().nonnegative().optional(),
}).refine(
  (data) => data.stockQuantity !== undefined || data.quantity !== undefined,
  {
    message: 'Either stockQuantity or quantity must be provided as a non-negative integer',
    path: ['stockQuantity'],
  }
);
export type UpdateStockInput = z.infer<typeof UpdateStockSchema>;

export const ToggleSpotlightSchema = z.object({
  isFeatured: z.boolean().optional(),
}).optional();
export type ToggleSpotlightInput = z.infer<typeof ToggleSpotlightSchema>;

export const GarmentSchema = CreateGarmentSchema.extend({
  id: z.string(),
  sku: z.string(),
  category: z.string(),
  status: GarmentStatus.default('draft'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Garment = z.infer<typeof GarmentSchema> & {
  title?: string;
  name?: string;
  price?: number;
  priceEtb?: number;
  stockQuantity?: number;
  quantity?: number;
  initialStock?: number;
  buyingPrice?: number | null;
  buyingPriceEtb?: number | null;
  profitMargin?: number | null;
  isFeatured?: boolean;
  is_featured?: boolean;
  colors?: (string | ProductColor)[];
  sizes?: (string | ProductSize)[];
  images?: string[];
  materials?: string[];
};

export const CatalogQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  storeId: z.string().optional(),
  material: z.string().optional(),
  materials: z.string().optional(),
  isFeatured: z.union([z.boolean(), z.string()]).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().positive().optional(),
});
export type CatalogQuery = z.infer<typeof CatalogQuerySchema>;

// ============================================================================
// 4. ORDER & FULFILLMENT SCHEMAS
// ============================================================================
export const OrderItemSchema = z.object({
  productId: z.string().optional(),
  id: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  storeId: z.string().nullable().optional(),
  quantity: z.number().int().positive().default(1),
  price: z.number().nonnegative().optional(),
  priceEtb: z.number().nonnegative().optional(),
  unitPrice: z.number().nonnegative().optional(),
  unitPriceFormatted: z.string().optional(),
  size: z.string().nullable().optional(),
  colorName: z.string().nullable().optional(),
  image: z.string().optional(),
  customMeasurements: CustomMeasurementsSchema.nullable().optional(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const CreateOrderSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('A valid customer email is required'),
  customerPhone: z.string().optional(),
  garmentTitle: z.string().optional(),
  garmentSku: z.string().optional(),
  garmentId: z.string().optional(),
  storeId: z.string().nullable().optional(),
  quantity: z.number().int().positive().optional().default(1),
  items: z.array(OrderItemSchema).optional(),
  totalPriceEtb: z.number().nonnegative().optional(),
  totalPrice: z.number().nonnegative().optional(),
  paymentMethod: z.string().optional().default('Mobile Transfer'),
  paymentStatus: z.string().optional().default('Paid'),
  paymentTxRef: z.string().nullable().optional(),
  paymentReference: z.string().nullable().optional(),
  paymentProvider: z.string().nullable().optional(),
  accountId: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
  confirmedReceiptAt: z.string().nullable().optional(),
  deliveryFee: z.number().nonnegative().optional(),
  discountEtb: z.number().nonnegative().optional(),
  shippingAddress: z.string().optional().default('Addis Ababa, Ethiopia'),
  trackingNumber: z.string().nullable().optional(),
  orderSource: OrderSource.default('phone'),
  status: OrderStatus.default('pending'),
  promoCode: z.string().nullable().optional(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatus.optional(),
  paymentStatus: z.string().optional(),
  trackingNumber: z.string().nullable().optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

export const OrderSchema = CreateOrderSchema.extend({
  id: z.string(),
  trackingNumber: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Order = z.infer<typeof OrderSchema> & {
  totalPriceEtb?: number;
  totalPrice?: number;
};

export const OrderQuerySchema = z.object({
  status: z.string().optional(),
  email: z.string().optional(),
  customerEmail: z.string().optional(),
  trackingNumber: z.string().optional(),
  query: z.string().optional(),
  q: z.string().optional(),
  orderSource: z.string().optional(),
  storeId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().positive().optional(),
});
export type OrderQuery = z.infer<typeof OrderQuerySchema>;

export const OrderTrackingTimelineEventSchema = z.object({
  status: z.string(),
  title: z.string(),
  description: z.string(),
  timestamp: z.string().nullable().optional(),
  completed: z.boolean(),
  current: z.boolean().optional(),
});
export type OrderTrackingTimelineEvent = z.infer<typeof OrderTrackingTimelineEventSchema>;

export const OrderTrackingDetailsSchema = z.object({
  id: z.string(),
  trackingNumber: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  deliveredAt: z.string().nullable().optional(),
  confirmedReceiptAt: z.string().nullable().optional(),
  customerName: z.string(),
  customerEmail: z.string().optional(),
  shippingAddress: z.string(),
  carrier: z.string().optional().default('Ethiopian Postal Service (EMS)'),
  estimatedDelivery: z.string().nullable().optional(),
  garmentTitle: z.string(),
  items: z.array(z.any()).optional(),
  quantity: z.number().default(1),
  totalPriceEtb: z.number().default(0),
  deliveryFee: z.number().default(0),
  paymentMethod: z.string(),
  paymentStatus: z.string(),
  timeline: z.array(OrderTrackingTimelineEventSchema),
});
export type OrderTrackingDetails = z.infer<typeof OrderTrackingDetailsSchema>;

// ============================================================================
// 5. CUSTOMER SCHEMAS
// ============================================================================
export const CreateCustomerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('A valid email is required'),
  phone: z.string().optional().default('N/A'),
  ordersCount: z.number().int().nonnegative().optional().default(0),
  totalSpentEtb: z.number().nonnegative().optional().default(0),
});
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export const CustomerSchema = CreateCustomerSchema.extend({
  id: z.string(),
  phone: z.string().default('N/A'),
  ordersCount: z.number().int().nonnegative().default(0),
  totalSpentEtb: z.number().nonnegative().default(0),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Customer = z.infer<typeof CustomerSchema>;

// ============================================================================
// 6. STORE LOCATION SCHEMAS
// ============================================================================
export const CreateStoreSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Store name is required'),
  location: z.string().min(1, 'Location is required'),
  isDefault: z.boolean().optional().default(false),
});
export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;

export const UpdateStoreSchema = CreateStoreSchema.partial();
export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>;

export const StoreLocationSchema = CreateStoreSchema.extend({
  id: z.string(),
  isDefault: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type StoreLocation = z.infer<typeof StoreLocationSchema>;

// ============================================================================
// 7. STAFF MANAGEMENT SCHEMAS
// ============================================================================
export const EmployeeRole = z.enum([
  'owner',
  'manager',
  'operator',
  'admin',
  'staff',
  'user',
  'Owner',
  'Manager',
  'Operator',
  'Admin',
]);
export type EmployeeRole = z.infer<typeof EmployeeRole>;

export const EmployeeDepartment = z.enum(['owner', 'sales', 'inventory', 'accounting', 'operations', 'staff']);
export type EmployeeDepartment = z.infer<typeof EmployeeDepartment>;

export const CreateStaffSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: EmployeeRole.optional(),
  department: EmployeeDepartment.optional(),
  status: StaffStatus.optional(),
  phone: z.string().optional(),
});
export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;

export const UpdateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  role: EmployeeRole.optional(),
  department: EmployeeDepartment.optional(),
  status: StaffStatus.optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  phone: z.string().optional(),
});
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;

export const StaffUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  department: z.string().optional(),
  status: z.string(),
  phone: z.string().optional(),
  joinedDate: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type StaffUser = z.infer<typeof StaffUserSchema>;

// ============================================================================
// 8. PROMO VALIDATION SCHEMAS
// ============================================================================
export const PromoValidationSchema = z.object({
  valid: z.boolean(),
  reason: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  kind: z.string().optional(),
  value: z.string().optional(),
  discountCents: z.number().optional(),
  discountFormatted: z.string().optional(),
});
export type PromoValidation = z.infer<typeof PromoValidationSchema>;

// ============================================================================
// 9. API RESPONSE WRAPPER & VALIDATION UTILITIES
// ============================================================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  statusCode?: number;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      fieldErrors: Record<string, string[]>;
      issues: z.ZodIssue[];
    };

/**
 * Validates any payload against a Zod schema using safeParse
 * and formats any errors cleanly using Zod 4 flattening and prettifying.
 */
export function validateData<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const flattened = z.flattenError(result.error);
  const fieldErrors = (flattened.fieldErrors || {}) as Record<string, string[] | undefined>;
  const firstField = Object.keys(fieldErrors)[0];
  const firstErrorMessage =
    flattened.formErrors[0] ||
    (firstField && fieldErrors[firstField]?.[0] ? `${firstField}: ${fieldErrors[firstField]![0]}` : undefined) ||
    result.error.issues[0]?.message ||
    'Validation failed';

  return {
    success: false,
    error: firstErrorMessage,
    fieldErrors: fieldErrors as Record<string, string[]>,
    issues: result.error.issues,
  };
}

// ============================================================================
// 10. DOMAIN UTILITIES & FINANCIAL HELPERS
// ============================================================================
/**
 * Format currency amount to ETB by default with standardized locale separation.
 */
export function formatCurrency(amount: number, currency = 'ETB'): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculate dynamic Profit Margin percentage: ((Price - BuyingPrice) / Price) * 100
 */
export function calculateProfitMargin(retailPrice: number, buyingPrice?: number | null): number {
  if (!buyingPrice || retailPrice <= 0) return 0;
  return Math.max(0, Math.round(((retailPrice - buyingPrice) / retailPrice) * 100));
}

export interface StockHealthInfo {
  percentage: number;
  initialStock: number;
  currentStock: number;
  unitsSold: number;
  isLow: boolean;
  isOutOfStock: boolean;
  healthColor: string;
}

/**
 * Calculates stock capacity against initialStock baseline
 */
export function calculateStockHealth(stockQuantity: number, initialStock?: number): StockHealthInfo {
  const currentStock = Math.max(0, stockQuantity ?? 0);
  const baseline = initialStock && initialStock > 0 ? initialStock : currentStock > 0 ? currentStock : 10;
  const percentage = Math.min(100, Math.max(0, Math.round((currentStock / baseline) * 100)));
  const unitsSold = Math.max(0, baseline - currentStock);
  const isOutOfStock = currentStock === 0;

  const isLow = isOutOfStock || percentage <= 20 || (currentStock <= 5 && currentStock < baseline);
  const healthColor = isLow ? '#dc2626' : '#16a34a';

  return {
    percentage,
    initialStock: baseline,
    currentStock,
    unitsSold,
    isLow,
    isOutOfStock,
    healthColor,
  };
}

/**
 * Intelligent helper to display the garment item type/subtext below the product name
 */
export function getGarmentTypeLabel(product: { name?: string; title?: string; category?: string; subtitle?: string } | any): string {
  const name = (product?.name || product?.title || '').toLowerCase();
  const cat = (product?.category || '').toLowerCase();

  if (name.includes('shemiz') || cat.includes('shemiz')) return 'Handwoven Shirt';
  if (name.includes('kemis') || cat.includes('kemis') || cat.includes('traditional')) return 'Traditional Dress';
  if (name.includes('tshirt') || name.includes('t-shirt')) return 'Cotton T-Shirt';
  if (name.includes('trouser') || name.includes('pant')) return 'Tailored Trousers';
  if (cat.includes('outerwear') || name.includes('jacket') || name.includes('coat')) return 'Artisan Outerwear';
  if (cat.includes('access')) return 'Handmade Accessory';
  if (cat.includes('footwear') || name.includes('shoe')) return 'Handcrafted Footwear';
  if (product?.subtitle) return product.subtitle;
  return 'Bespoke Garment';
}

/**
 * Matches product category strings against filter IDs
 */
export function matchesCategoryFilter(productCategory: string, filterId: string): boolean {
  if (!filterId || filterId === 'all') return true;
  const pCat = (productCategory || '').toLowerCase();
  const f = filterId.toLowerCase();

  if (f === 'rtw') {
    return (
      pCat === 'rtw' ||
      pCat.includes('ready') ||
      pCat.includes('shemiz') ||
      pCat.includes('t-shirt') ||
      pCat.includes('tshirt')
    );
  }
  if (f === 'traditional') {
    return (
      pCat === 'traditional' ||
      pCat.includes('kemis') ||
      pCat.includes('habesha') ||
      pCat.includes('menen') ||
      pCat.includes('dress')
    );
  }
  if (f === 'outerwear') {
    return pCat === 'outerwear' || pCat.includes('jacket') || pCat.includes('coat');
  }
  if (f === 'accessories') {
    return pCat === 'accessories' || pCat.includes('accessory') || pCat.includes('watch') || pCat.includes('scarf');
  }
  if (f === 'footwear') {
    return pCat === 'footwear' || pCat.includes('shoe') || pCat.includes('sneaker');
  }
  return pCat === f || pCat.includes(f);
}

// ============================================================================
// 12. CHAPA PAYMENT GATEWAY SCHEMAS & ETHIOPIAN HELPERS
// ============================================================================

export const EthiopianPhoneRegex = /^(09|07)\d{8}$/;

/**
 * Normalizes Ethiopian phone numbers to the 10-digit standard required by Chapa
 * Examples:
 * "+251912345678" -> "0912345678"
 * "251712345678"  -> "0712345678"
 * "912345678"     -> "0912345678"
 * "0912345678"    -> "0912345678"
 */
export function normalizeEthiopianPhone(phone: string): string {
  if (!phone) return "";
  // Strip all non-digit characters (+, spaces, hyphens)
  let clean = phone.replace(/\D/g, "");

  if (clean.startsWith("251") && clean.length === 12) {
    clean = "0" + clean.slice(3);
  } else if ((clean.startsWith("9") || clean.startsWith("7")) && clean.length === 9) {
    clean = "0" + clean;
  }

  return clean;
}

export const InitializeChapaPaymentSchema = z.object({
  orderId: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid customer email is required"),
  customerPhone: z.string().min(9, "Customer phone number is required"),
  items: z.array(OrderItemSchema).optional(),
  garmentTitle: z.string().optional(),
  garmentSku: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  totalPriceEtb: z.number().nonnegative().optional(),
  shippingAddress: z.string().optional().default("Addis Ababa, Ethiopia"),
  orderSource: OrderSource.optional().default("app"),
  storeId: z.string().nullable().optional(),
  promoCode: z.string().nullable().optional(),
  returnUrl: z.string().optional(),
});
export type InitializeChapaPaymentInput = z.infer<typeof InitializeChapaPaymentSchema>;

export const VerifyChapaPaymentSchema = z.object({
  txRef: z.string().min(1, "Transaction reference (txRef) is required"),
  orderId: z.string().optional(),
});
export type VerifyChapaPaymentInput = z.infer<typeof VerifyChapaPaymentSchema>;

export const ChapaPaymentResultSchema = z.object({
  checkoutUrl: z.string().url(),
  txRef: z.string(),
  orderId: z.string(),
});
export type ChapaPaymentResult = z.infer<typeof ChapaPaymentResultSchema>;

// ============================================================================
// 13. ERP: SUPPLIER SCHEMAS
// ============================================================================
export const SupplierStatus = z.enum(['active', 'inactive']);
export type SupplierStatus = z.infer<typeof SupplierStatus>;

export const CreateSupplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Supplier name is required'),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().optional().default('Ethiopia'),
  taxId: z.string().nullable().optional(),
  paymentTerms: z.string().optional().default('Net 30'),
  status: SupplierStatus.default('active'),
  notes: z.string().nullable().optional(),
});
export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;

export const UpdateSupplierSchema = CreateSupplierSchema.partial();
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;

export const SupplierSchema = CreateSupplierSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Supplier = z.infer<typeof SupplierSchema>;

// ============================================================================
// 14. ERP: PURCHASE ORDER SCHEMAS
// ============================================================================
export const PurchaseOrderStatus = z.enum(['draft', 'submitted', 'received', 'cancelled']);
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatus>;

export const PurchaseOrderItemSchema = z.object({
  id: z.string().optional(),
  garmentId: z.string().nullable().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitCostEtb: z.number().nonnegative('Unit cost must be non-negative'),
  totalCostEtb: z.number().nonnegative().optional(),
});
export type PurchaseOrderItem = z.infer<typeof PurchaseOrderItemSchema>;

export const CreatePurchaseOrderSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier is required'),
  status: PurchaseOrderStatus.default('draft'),
  totalAmountEtb: z.number().nonnegative().optional(),
  taxAmountEtb: z.number().nonnegative().optional(),
  shippingCostEtb: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional(),
  expectedDeliveryDate: z.string().nullable().optional(),
  accountId: z.string().nullable().optional(),
  grnNumber: z.string().nullable().optional(),
  paymentStatus: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  items: z.array(PurchaseOrderItemSchema).min(1, 'At least one item is required'),
});
export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>;

export const PurchaseOrderSchema = CreatePurchaseOrderSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

// ============================================================================
// 15. ERP: EXPENSE SCHEMAS
// ============================================================================
export const ExpenseCategory = z.enum([
  'rent',
  'utilities',
  'salaries',
  'shipping',
  'marketing',
  'supplies',
  'equipment',
  'maintenance',
  'other',
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategory>;

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  rent: 'Rent & Lease',
  utilities: 'Utilities',
  salaries: 'Salaries & Wages',
  shipping: 'Shipping & Logistics',
  marketing: 'Marketing & Advertising',
  supplies: 'Office Supplies',
  equipment: 'Equipment & Tools',
  maintenance: 'Maintenance & Repairs',
  other: 'Other Expenses',
};

export const CreateExpenseSchema = z.object({
  id: z.string().optional(),
  category: ExpenseCategory,
  description: z.string().min(1, 'Description is required'),
  amountEtb: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  paymentMethod: z.string().optional().default('cash'),
  reference: z.string().nullable().optional(),
  accountId: z.string().nullable().optional(),
});
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

export const ExpenseSchema = CreateExpenseSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});
export type Expense = z.infer<typeof ExpenseSchema>;

// ============================================================================
// 16. ERP: SHIPMENT SCHEMAS
// ============================================================================
export const ShipmentCarrier = z.enum(['fedex', 'dhl', 'local_courier', 'self_pickup', 'other']);
export type ShipmentCarrier = z.infer<typeof ShipmentCarrier>;

export const ShipmentStatus = z.enum(['pending', 'in_transit', 'delivered', 'returned']);
export type ShipmentStatus = z.infer<typeof ShipmentStatus>;

export const CreateShipmentSchema = z.object({
  id: z.string().optional(),
  orderId: z.string().min(1, 'Order ID is required'),
  carrier: ShipmentCarrier,
  trackingNumber: z.string().nullable().optional(),
  status: ShipmentStatus.default('pending'),
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  shippingCostEtb: z.number().nonnegative().optional().default(0),
  estimatedDelivery: z.string().nullable().optional(),
  actualDelivery: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;

export const UpdateShipmentSchema = z.object({
  carrier: ShipmentCarrier.optional(),
  trackingNumber: z.string().nullable().optional(),
  status: ShipmentStatus.optional(),
  shippingCostEtb: z.number().nonnegative().optional(),
  estimatedDelivery: z.string().nullable().optional(),
  actualDelivery: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type UpdateShipmentInput = z.infer<typeof UpdateShipmentSchema>;

export const ShipmentSchema = CreateShipmentSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Shipment = z.infer<typeof ShipmentSchema>;

// ============================================================================
// 17. ERP: FINANCIAL REPORT & BANKING SCHEMAS
// ============================================================================
export const BankAccountType = z.enum(['bank', 'cash', 'telebirr', 'cbe_birr']);
export type BankAccountType = z.infer<typeof BankAccountType>;

export const CreateBankAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  accountType: BankAccountType.optional().default('bank'),
  initialBalance: z.number().nonnegative().optional().default(0),
  isDefault: z.boolean().optional().default(false),
});
export type CreateBankAccountInput = z.infer<typeof CreateBankAccountSchema>;

export const BankAccountSchema = CreateBankAccountSchema.extend({
  id: z.string(),
  currentBalance: z.number(),
  currency: z.string().default('ETB'),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BankAccount = z.infer<typeof BankAccountSchema>;

export const FinancialTransactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  type: z.enum(['deposit', 'withdrawal', 'expense', 'sale_income', 'supplier_payment', 'transfer']),
  amountEtb: z.number(),
  balanceAfter: z.number(),
  description: z.string(),
  category: z.string(),
  referenceId: z.string().nullable().optional(),
  date: z.string(),
  createdAt: z.string(),
  accountName: z.string().optional(),
  bankName: z.string().optional(),
});
export type FinancialTransaction = z.infer<typeof FinancialTransactionSchema>;

export const FinanceSummarySchema = z.object({
  totalLiquidity: z.number().optional(),
  bankBalance: z.number().optional(),
  cashBalance: z.number().optional(),
  telebirrBalance: z.number().optional(),
  totalRevenue: z.number(),
  totalExpenses: z.number(),
  netProfit: z.number(),
  profitMargin: z.number(),
  orderCount: z.number(),
  expenseCount: z.number(),
  averageOrderValue: z.number(),
});
export type FinanceSummary = z.infer<typeof FinanceSummarySchema>;

export const ExpenseBreakdownSchema = z.object({
  category: z.string(),
  label: z.string(),
  total: z.number(),
  count: z.number(),
  percentage: z.number(),
});
export type ExpenseBreakdown = z.infer<typeof ExpenseBreakdownSchema>;

export const ProfitLossReportSchema = z.object({
  period: z.string(),
  revenue: z.number(),
  costOfGoodsSold: z.number(),
  grossProfit: z.number(),
  expenses: z.array(ExpenseBreakdownSchema),
  totalExpenses: z.number(),
  netProfit: z.number(),
  profitMargin: z.number(),
});
export type ProfitLossReport = z.infer<typeof ProfitLossReportSchema>;

