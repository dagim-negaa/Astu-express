CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amountEtb` real NOT NULL,
	`date` text NOT NULL,
	`paymentMethod` text DEFAULT 'cash',
	`reference` text,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`purchaseOrderId` text NOT NULL,
	`garmentId` text,
	`description` text NOT NULL,
	`quantity` integer NOT NULL,
	`unitCostEtb` real NOT NULL,
	`totalCostEtb` real NOT NULL,
	FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`garmentId`) REFERENCES `garments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`supplierId` text NOT NULL,
	`status` text DEFAULT 'draft',
	`totalAmountEtb` real DEFAULT 0 NOT NULL,
	`taxAmountEtb` real DEFAULT 0,
	`shippingCostEtb` real DEFAULT 0,
	`notes` text,
	`expectedDeliveryDate` text,
	`receivedAt` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`orderId` text NOT NULL,
	`carrier` text NOT NULL,
	`trackingNumber` text,
	`status` text DEFAULT 'pending',
	`shippingAddress` text NOT NULL,
	`shippingCostEtb` real DEFAULT 0,
	`estimatedDelivery` text,
	`actualDelivery` text,
	`notes` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`address` text,
	`city` text,
	`country` text DEFAULT 'Ethiopia',
	`taxId` text,
	`paymentTerms` text DEFAULT 'Net 30',
	`status` text DEFAULT 'active',
	`notes` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `user` ADD `department` text DEFAULT 'staff';