import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';

// 1. Better Auth Schema for Cloudflare D1
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  role: text('role').default('user'),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('banReason'),
  banExpires: integer('banExpires', { mode: 'timestamp' }),
  status: text('status').notNull().default('Active'),
  phone: text('phone'),
  department: text('department').default('staff'), // owner | manager | staff
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});


export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonatedBy'),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  issuer: text('issuer'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
});

// 2. Domain Schema: Garments / Products Catalog
export const garments = sqliteTable('garments', {
  id: text('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(), // rtw | accessories | footwear | traditional | outerwear
  storeId: text('storeId'),
  priceEtb: real('priceEtb').notNull(),
  buyingPriceEtb: real('buyingPriceEtb'),
  profitMargin: real('profitMargin'),
  stockQuantity: integer('stockQuantity').notNull().default(0),
  initialStock: integer('initialStock').notNull().default(0),
  status: text('status').notNull().default('draft'), // in_production | draft | quality_check | completed
  color: text('color').notNull().default('Standard'),
  size: text('size').notNull().default('Standard'),
  colors: text('colors'), // JSON array of colors
  sizes: text('sizes'), // JSON array of sizes
  materials: text('materials'), // JSON array of materials
  images: text('images'), // JSON array of image URLs
  description: text('description'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// 3. Financial Accounts & Banking (CBE, Awash, Telebirr, Cash Vault)
export const bankAccounts = sqliteTable('bank_accounts', {
  id: text('id').primaryKey(),
  accountName: text('accountName').notNull(), // e.g. "CBE - Main Operations", "Telebirr Merchant", "Cash Vault"
  bankName: text('bankName').notNull(), // Commercial Bank of Ethiopia, Telebirr, Awash Bank, Cash on Hand
  accountNumber: text('accountNumber').notNull(),
  accountType: text('accountType').notNull().default('bank'), // bank | cash | telebirr | cbe_birr
  initialBalance: real('initialBalance').notNull().default(0),
  currentBalance: real('currentBalance').notNull().default(0),
  currency: text('currency').notNull().default('ETB'),
  isDefault: integer('isDefault', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('active'), // active | inactive
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// 4. Financial Ledger / Transactions (Deposits, Expenses, Sales Income, Procurement)
export const financialTransactions = sqliteTable('financial_transactions', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull().references(() => bankAccounts.id),
  type: text('type').notNull(), // deposit | withdrawal | expense | sale_income | supplier_payment | transfer
  amountEtb: real('amountEtb').notNull(),
  balanceAfter: real('balanceAfter').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // working_capital | rent | utilities | salaries | shipping | marketing | supplies | procurement | sales | transfer | other
  referenceId: text('referenceId'), // orderId, expenseId, purchaseOrderId, etc.
  date: text('date').notNull(),
  createdAt: text('createdAt').notNull(),
});

// 5. Domain Schema: Orders & Fulfillment Pipeline
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  customerName: text('customerName').notNull(),
  customerEmail: text('customerEmail').notNull(),
  customerPhone: text('customerPhone'),
  garmentTitle: text('garmentTitle').notNull(),
  garmentSku: text('garmentSku').notNull(),
  quantity: integer('quantity').notNull().default(1),
  items: text('items'), // JSON-serialized array of order items
  totalPriceEtb: real('totalPriceEtb').notNull(),
  paymentMethod: text('paymentMethod').notNull().default('Mobile Transfer'),
  paymentStatus: text('paymentStatus').notNull().default('unpaid'),
  paymentTxRef: text('paymentTxRef'),
  paymentReference: text('paymentReference'),
  paymentProvider: text('paymentProvider').default('chapa'),
  accountId: text('accountId').references(() => bankAccounts.id), // Bank account receiving order revenue
  paidAt: text('paidAt'),
  deliveredAt: text('deliveredAt'),
  confirmedReceiptAt: text('confirmedReceiptAt'),
  deliveryFee: real('deliveryFee').notNull().default(0),
  promoCode: text('promoCode'),
  discountEtb: real('discountEtb').notNull().default(0),
  status: text('status').notNull().default('pending'), // pending | processing | shipped | delivered | cancelled
  trackingNumber: text('trackingNumber'),
  shippingAddress: text('shippingAddress').notNull().default('Addis Ababa, Ethiopia'),
  orderSource: text('orderSource').notNull().default('web'), // web | phone | pos
  storeId: text('storeId'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// 6. Domain Schema: Customers Directory
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull().default('N/A'),
  ordersCount: integer('ordersCount').notNull().default(0),
  totalSpentEtb: real('totalSpentEtb').notNull().default(0),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// 7. Domain Schema: Store Locations
export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  isDefault: integer('isDefault', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// 8. ERP Schema: Suppliers
export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  country: text('country').default('Ethiopia'),
  taxId: text('taxId'),
  paymentTerms: text('paymentTerms').default('Net 30'),
  status: text('status').default('active'), // active | inactive
  notes: text('notes'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// 8b. ERP Schema: Warehouses (Central Garment Hubs & Depots)
export const warehouses = sqliteTable('warehouses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  location: text('location').notNull(),
  isDefault: integer('isDefault', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('active'), // active | inactive
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// 8c. ERP Schema: Warehouse Inventory Items (Received via GRN from suppliers, ready for storefront production)
export const warehouseItems = sqliteTable('warehouse_items', {
  id: text('id').primaryKey(),
  warehouseId: text('warehouseId').notNull().references(() => warehouses.id),
  purchaseOrderId: text('purchaseOrderId').references(() => purchaseOrders.id),
  supplierId: text('supplierId').references(() => suppliers.id),
  supplierName: text('supplierName'),
  grnNumber: text('grnNumber'),
  itemTitle: text('itemTitle').notNull(),
  category: text('category').notNull().default('rtw'), // rtw | accessories | footwear | traditional | outerwear | suits
  quantity: integer('quantity').notNull().default(0), // Available quantity in warehouse
  receivedQuantity: integer('receivedQuantity').notNull().default(0), // Total received from GRN
  transferredQuantity: integer('transferredQuantity').notNull().default(0), // Transferred to storefront
  unitCostEtb: real('unitCostEtb').notNull().default(0), // Supplier cost per piece
  totalCostEtb: real('totalCostEtb').notNull().default(0),
  status: text('status').notNull().default('in_warehouse'), // in_warehouse | partially_transferred | transferred_to_production | depleted
  receivedAt: text('receivedAt').notNull(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// 9. ERP Schema: Purchase Orders & Procurement (with GRN, Warehouse & Bank Account integration)
export const purchaseOrders = sqliteTable('purchase_orders', {
  id: text('id').primaryKey(),
  supplierId: text('supplierId').notNull().references(() => suppliers.id),
  warehouseId: text('warehouseId').references(() => warehouses.id), // Receiving warehouse
  status: text('status').default('draft'), // draft | submitted | received | cancelled
  paymentStatus: text('paymentStatus').default('unpaid'), // unpaid | paid
  accountId: text('accountId').references(() => bankAccounts.id), // Bank account paying the supplier
  totalAmountEtb: real('totalAmountEtb').notNull().default(0),
  taxAmountEtb: real('taxAmountEtb').default(0),
  shippingCostEtb: real('shippingCostEtb').default(0),
  grnNumber: text('grnNumber'), // Goods Received Note (GRN) number e.g. "GRN-2026-001"
  notes: text('notes'),
  expectedDeliveryDate: text('expectedDeliveryDate'),
  receivedAt: text('receivedAt'),
  paidAt: text('paidAt'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// 10. ERP Schema: Purchase Order Items (Linked to Garment Catalog or Warehouse Stock)
export const purchaseOrderItems = sqliteTable('purchase_order_items', {
  id: text('id').primaryKey(),
  purchaseOrderId: text('purchaseOrderId').notNull().references(() => purchaseOrders.id),
  garmentId: text('garmentId').references(() => garments.id),
  description: text('description').notNull(),
  category: text('category').default('rtw'),
  quantity: integer('quantity').notNull(),
  unitCostEtb: real('unitCostEtb').notNull(),
  totalCostEtb: real('totalCostEtb').notNull(),
});

// 11. ERP Schema: Expenses (Linked to Bank Account)
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  category: text('category').notNull(), // rent | utilities | salaries | shipping | marketing | supplies | other
  description: text('description').notNull(),
  amountEtb: real('amountEtb').notNull(),
  date: text('date').notNull(),
  paymentMethod: text('paymentMethod').default('cash'), // cash | bank_transfer | telebirr
  accountId: text('accountId').references(() => bankAccounts.id), // Bank/Cash account paying the expense
  reference: text('reference'),
  createdAt: text('createdAt').notNull(),
});

// 12. ERP Schema: Shipments
export const shipments = sqliteTable('shipments', {
  id: text('id').primaryKey(),
  orderId: text('orderId').notNull().references(() => orders.id),
  carrier: text('carrier').notNull(), // fedex | dhl | local_courier | self_pickup
  trackingNumber: text('trackingNumber'),
  status: text('status').default('pending'), // pending | in_transit | delivered | returned
  shippingAddress: text('shippingAddress').notNull(),
  shippingCostEtb: real('shippingCostEtb').default(0),
  estimatedDelivery: text('estimatedDelivery'),
  actualDelivery: text('actualDelivery'),
  notes: text('notes'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// 13. Built-in Cloudflare D1 Object Storage (Persistent Media & Proxy Fallback)
export const storageObjects = sqliteTable('storage_objects', {
  key: text('key').primaryKey(),
  data: blob('data', { mode: 'buffer' }).notNull(),
  contentType: text('contentType').notNull().default('image/webp'),
  size: integer('size').notNull().default(0),
  etag: text('etag').notNull(),
  uploadedAt: integer('uploadedAt', { mode: 'timestamp' }).notNull(),
});
