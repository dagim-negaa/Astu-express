INSERT INTO orders (
  id, customerName, customerEmail, customerPhone, garmentTitle, garmentSku,
  quantity, items, totalPriceEtb, paymentMethod, paymentStatus, paymentTxRef,
  paymentReference, paymentProvider, deliveryFee, status, trackingNumber,
  shippingAddress, orderSource, createdAt, updatedAt
) VALUES
(
  'ord-eth-kemis-01', 'Abebe Bikila', 'abebe@example.com', '+251911223344',
  'Traditional Habesha Kemis (Royal Gold Tilet)', 'ETH-KEMIS-001', 1,
  '[{"productId":"garm-kemis-01","sku":"ETH-KEMIS-001","title":"Traditional Habesha Kemis (Royal Gold Tilet)","quantity":1,"priceEtb":4800,"size":"M","colorName":"Ivory White","image":"/api/assets/products/kemis-trad-01/preview.webp"}]',
  4800, 'Telebirr', 'paid', 'TX-TB-99214', 'TB-CONF-4491', 'telebirr', 150,
  'shipped', 'ETH-TRK-882194A', 'Bole Sub-city, Woreda 03, House 412, Addis Ababa',
  'web', datetime('now', '-2 days'), datetime('now', '-4 hours')
),
(
  'ord-eth-jacket-02', 'Marta Haile', 'marta@example.com', '+251922334455',
  'Modern Ethiopian Shemma Bomber Jacket', 'ETH-JACKET-003', 2,
  '[{"productId":"garm-jacket-03","sku":"ETH-JACKET-003","title":"Modern Ethiopian Shemma Bomber Jacket","quantity":2,"priceEtb":5400,"size":"L","colorName":"Oatmeal Beige","image":"/api/assets/products/shemma-jacket-01/preview.webp"}]',
  10800, 'CBE Birr', 'paid', 'TX-CBE-81204', 'CBE-CONF-9201', 'cbe_birr', 200,
  'delivered', 'ETH-TRK-552019B', 'Kazanchis, Near UNECA, Kirkos, Addis Ababa',
  'web', datetime('now', '-5 days'), datetime('now', '-1 day')
),
(
  'ord-eth-oxford-03', 'Dawit Kebede', 'dawit@example.com', '+251933445566',
  'Highland Handcrafted Leather Oxford Shoes', 'ETH-SHOES-005', 1,
  '[{"productId":"garm-shoes-05","sku":"ETH-SHOES-005","title":"Highland Handcrafted Leather Oxford Shoes","quantity":1,"priceEtb":4200,"size":"42","colorName":"Cognac Brown","image":"/api/assets/products/leather-oxford-01/preview.webp"}]',
  4200, 'Cash on Delivery', 'unpaid', NULL, NULL, NULL, 150,
  'processing', 'ETH-TRK-339108C', 'Piazza Heritage Quarter, Arada, Addis Ababa',
  'web', datetime('now', '-1 day'), datetime('now', '-2 hours')
)
ON CONFLICT (id) DO UPDATE SET
  trackingNumber = excluded.trackingNumber,
  status = excluded.status,
  updatedAt = excluded.updatedAt;

INSERT INTO shipments (
  id, orderId, carrier, trackingNumber, status, shippingAddress,
  shippingCostEtb, estimatedDelivery, notes, createdAt, updatedAt
) VALUES
(
  'ship-kemis-01', 'ord-eth-kemis-01', 'Ethiopian Postal Service (EMS)',
  'ETH-TRK-882194A', 'in_transit', 'Bole Sub-city, Woreda 03, House 412, Addis Ababa',
  150, date('now', '+1 day'), 'Dispatched from central Addis Atelier, on courier route',
  datetime('now', '-2 days'), datetime('now', '-4 hours')
),
(
  'ship-jacket-02', 'ord-eth-jacket-02', 'Ethiopian Postal Service (EMS)',
  'ETH-TRK-552019B', 'delivered', 'Kazanchis, Near UNECA, Kirkos, Addis Ababa',
  200, date('now', '-1 day'), 'Delivered safely to recipient at Kazanchis',
  datetime('now', '-5 days'), datetime('now', '-1 day')
),
(
  'ship-oxford-03', 'ord-eth-oxford-03', 'Tikur Abbay Express Logistics',
  'ETH-TRK-339108C', 'pending', 'Piazza Heritage Quarter, Arada, Addis Ababa',
  150, date('now', '+2 days'), 'Packed and awaiting courier pickup at Piazza dispatch center',
  datetime('now', '-1 day'), datetime('now', '-2 hours')
)
ON CONFLICT (id) DO UPDATE SET
  trackingNumber = excluded.trackingNumber,
  status = excluded.status,
  updatedAt = excluded.updatedAt;
