# Web-Based Mini ERP System for Inventory, Sales and Financial Operations

## ASTU Express

ASTU Express is a web-based mini ERP system designed to manage the complete business operations of an Ethiopian online shopping center. It provides a single platform for selling products online, managing inventory, processing orders, handling payments, tracking suppliers and expenses, and generating financial reports.

---

## Problem Statement

Running a retail business involves many moving parts. Products need to be listed and tracked. Orders come in from customers and need to be fulfilled. Money flows in from sales and flows out through expenses, supplier payments, and operational costs. Without a unified system, businesses rely on spreadsheets, paper records, or multiple disconnected tools. This leads to stock errors, lost orders, unclear finances, and wasted time.

ASTU Express solves this by bringing all core business operations into one web-based system that anyone with a browser can access.

---

## Target Users

### Customers (External)
People who visit the online storefront to browse and purchase products. They interact only with the storefront and do not have access to the admin dashboard.

### Admin and Staff (Internal)
People who work for the business and use the admin dashboard to manage products, orders, customers, suppliers, expenses, and financial reports. Their access level depends on their assigned role.

---

## Core Features

### 1. Product Catalog Management

The system allows admins to build and maintain a complete product catalog. Each product has a unique SKU code, a title, a category, a retail price in Ethiopian Birr, a buying cost, stock quantity, available colors, available sizes, images, and a description.

Products are organized into categories: Ready-to-Wear, Traditional, Outerwear, Accessories, and Footwear. Customers can browse by category on the storefront.

Admins can see the profit margin on each product, which is calculated automatically based on the retail price and the buying cost. This helps the business understand which products are most profitable.

Products can be marked as featured or spotlighted to highlight them on the storefront homepage. Running low on stock is clearly visible so the business knows when to reorder.

### 2. Order Management

When a customer places an order on the storefront, the system records all details: what products were ordered, the quantity of each, the selected size and color, the total price, the customer information, and the shipping address.

Orders follow a status lifecycle: pending, processing, shipped, and delivered. Admins update the status as the order moves through the fulfillment process.

When an order is placed, the stock quantity of each purchased product is automatically reduced. This prevents overselling and keeps inventory accurate.

Orders can include multiple items in a single transaction. Promo codes and discounts can be applied to orders, and delivery fees are tracked separately.

### 3. Customer Management

The system maintains a directory of all customers who have placed orders. Each customer record includes their name, email, phone number, total number of orders, and total amount spent in Ethiopian Birr.

Customer records are automatically created when a new order is placed. If a returning customer places another order, their existing record is updated with the new order count and spending total.

Admins can view the full order history for any customer, making it easy to see purchasing patterns and identify loyal customers.

### 4. Payment Processing

The system supports two payment methods:

**Cash on Delivery** is currently active. Customers pay in cash when they receive their order. The admin marks the order as paid once cash is collected.

**Chapa Online Payment** is planned for future activation. Chapa is an Ethiopian online payment gateway that will allow customers to pay digitally during checkout. The integration code is in place but not yet live.

### 5. Supplier and Procurement Management

The business needs to buy stock from suppliers. The system maintains a supplier directory with each supplier's name, phone, email, address, city, country, tax identification number, and payment terms (such as Net 30).

Admins can create purchase orders to buy stock from suppliers. Each purchase order lists the items being ordered, the quantity, the unit cost, and the total cost. Purchase orders follow a status lifecycle: draft, submitted, and received.

When stock arrives from a supplier, the purchase order is marked as received. This helps the business track what has been ordered, what is pending, and what has been delivered.

### 6. Expense Tracking

The system tracks all business expenses across categories: Rent, Utilities, Salaries, Shipping, Marketing, Office Supplies, Equipment, Maintenance, and Other.

Each expense record includes the category, a description, the amount in Ethiopian Birr, the date, the payment method (cash, bank transfer, or mobile money), and an optional reference number.

This gives the business a complete picture of where money is going and helps with budgeting and financial planning.

### 7. Financial Reporting

The system generates financial reports that show the business's financial health:

**Revenue vs Expenses** shows total money earned from orders versus total money spent on expenses.

**Profit and Loss** calculates net profit by subtracting expenses and cost of goods sold from revenue. This can be viewed for any time period.

**Expense Breakdown** shows how much was spent in each expense category, helping the business identify where the most money is going.

**Profit Margin** shows the percentage of revenue that is actual profit after all costs are accounted for.

**Average Order Value** shows the typical amount a customer spends per order.

These reports help the business owner make informed decisions about pricing, costs, and growth.

### 8. Multi-Store Management

The business can operate from multiple store locations. For example, one store in Adama and another in Addis Ababa.

Products and orders can be linked to specific store locations. This allows the business to track which store is performing better and manage inventory separately for each location.

### 9. Staff and Role Management

Admins can create staff accounts and assign each staff member a role. The role determines what the staff member can access and do within the system.

Staff accounts can be activated or deactivated. Deactivated staff cannot log in. Admins can change roles, reset passwords, and delete staff accounts when needed.

---

## Role-Based Access Control

The system uses three staff roles with different levels of access. This ensures that staff members can only see and do what their job requires.

### Admin Role

The Admin has full access to everything in the system. This includes managing products, orders, customers, staff accounts, store locations, suppliers, purchase orders, expenses, financial reports, and the ability to reset the database. The Admin role is intended for the business owner or a trusted senior manager.

### Manager Role

The Manager has operational access. They can manage suppliers (create and edit), create and update purchase orders, create and delete expenses, and manage shipments. They cannot manage staff accounts, manage store locations, or view financial reports. The Manager role is intended for someone who handles day-to-day procurement and operational tasks.

### Operator Role

The Operator has day-to-day access. They can manage the product catalog (add products, update stock levels, toggle featured status, delete individual products), update order statuses, view the customer directory, and upload product images. They cannot manage suppliers, expenses, purchase orders, staff, or stores. The Operator role is intended for a staff member who handles product listing and order fulfillment.

### Owner Account

When the system is first set up, an initial admin account is created with the role of Owner. This account has the same full access as the Admin role. The Owner account is the master account that cannot be deleted and is used for initial system setup and as a fallback.

### Permission Summary

- Admin: Can do everything
- Manager: Can manage suppliers, purchase orders, expenses, and shipments
- Operator: Can manage products, orders, customers, and image uploads
- Owner: Same as Admin (master account)

---

## Business Flow

The following describes how ASTU Express is used in a typical business day:

**Step 1: System Setup**
The business owner sets up the system by creating store locations, adding staff accounts with appropriate roles, and configuring the initial settings.

**Step 2: Product Listing**
The admin or operator adds products to the catalog. Each product is given a name, category, price, buying cost, stock quantity, available colors and sizes, images, and a description. Products are now visible on the storefront for customers to browse.

**Step 3: Customer Browsing**
A customer visits the storefront. They see all available products organized by category. They can search for specific items, filter by category or price range, and view product details including images, price, available sizes, and colors.

**Step 4: Customer Ordering**
The customer adds products to their shopping bag. At checkout, they enter their name, email, phone number, and shipping address. They choose a payment method. They review their order and place it.

**Step 5: Stock Update**
The moment an order is placed, the system automatically reduces the stock quantity of each ordered product. This keeps inventory accurate in real time.

**Step 6: Order Fulfillment**
The admin or operator sees the new order in the dashboard. They review the order details, update the status to processing, prepare the order for delivery, and then update the status to shipped or delivered once the customer receives it.

**Step 7: Payment Collection**
If the customer chose cash on delivery, the admin marks the order as paid once cash is collected. If Chapa online payment is active in the future, payment is verified automatically through the payment gateway.

**Step 8: Customer Follow-Up**
The customer can check their order status on the storefront at any time. They see the current status and can track the progress of their order.

**Step 9: Financial Tracking**
As orders are fulfilled and expenses are recorded, the system continuously calculates revenue, expenses, and profit. The business owner can view financial reports at any time to understand the financial health of the business.

**Step 10: Reordering Stock**
When products run low, the manager creates a purchase order to a supplier to buy more stock. When the stock arrives, the purchase order is marked as received and inventory is updated.

---

## Customer Experience

When a customer visits the ASTU Express storefront, they see a clean, professional online store. They can:

- Browse all products organized by category
- Search for specific products by name
- Filter products by category and price range
- View product details including images, price, colors, sizes, and description
- Add products to their shopping bag
- Review their bag and see the total price
- Proceed to checkout and enter their delivery information
- Choose a payment method (cash on delivery or Chapa online payment when available)
- Place their order and receive confirmation
- View their order history and track order status

The entire experience is designed to be simple and straightforward, requiring no account creation or login to browse and purchase.

---

## Admin Experience

When an admin or staff member logs into the ASTU Express dashboard, they see a management interface tailored to their role. They can:

- View an overview of key business metrics (total orders, revenue, low stock alerts)
- Manage the full product catalog (add, edit, delete products, update stock, set featured items)
- View and manage all orders (update status, view details, track payments)
- View the customer directory and individual customer histories
- Manage staff accounts (create, edit, deactivate, delete)
- Manage store locations
- Manage suppliers and create purchase orders
- Record and track business expenses
- View financial reports (revenue, expenses, profit and loss)
- Upload and manage product images

The dashboard is designed for efficiency, allowing staff to quickly find what they need and take action without unnecessary steps.

---

## Summary

ASTU Express is a complete web-based business management system that handles inventory, sales, and financial operations in a single platform. It gives Ethiopian retail businesses the tools they need to sell online, manage stock, process orders, track payments, handle suppliers and expenses, and understand their financial performance — all through a simple, role-based web interface.
