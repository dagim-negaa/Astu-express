ALTER TABLE `orders` ADD `paymentStatus` text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentTxRef` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentReference` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentProvider` text DEFAULT 'chapa';--> statement-breakpoint
ALTER TABLE `orders` ADD `paidAt` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveredAt` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `confirmedReceiptAt` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryFee` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `promoCode` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `discountEtb` real DEFAULT 0 NOT NULL;