PRAGMA foreign_keys = OFF;

DELETE FROM financial_transactions;
DELETE FROM expenses;
DELETE FROM shipments;
DELETE FROM orders;
DELETE FROM warehouse_items;
DELETE FROM purchase_order_items;
DELETE FROM purchase_orders;
DELETE FROM garments;
DELETE FROM customers;
DELETE FROM suppliers;
DELETE FROM session;
DELETE FROM verification;
DELETE FROM storage_objects;
DELETE FROM account WHERE userId IN (SELECT id FROM user WHERE lower(COALESCE(role, 'customer')) NOT IN ('admin', 'manager', 'operator', 'owner'));
DELETE FROM user WHERE lower(COALESCE(role, 'customer')) NOT IN ('admin', 'manager', 'operator', 'owner');

UPDATE bank_accounts SET currentBalance = 0, initialBalance = 0;

PRAGMA foreign_keys = ON;
