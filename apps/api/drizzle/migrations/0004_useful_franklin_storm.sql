CREATE TABLE `bank_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`accountName` text NOT NULL,
	`bankName` text NOT NULL,
	`accountNumber` text NOT NULL,
	`accountType` text DEFAULT 'bank' NOT NULL,
	`initialBalance` real DEFAULT 0 NOT NULL,
	`currentBalance` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'ETB' NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `financial_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`type` text NOT NULL,
	`amountEtb` real NOT NULL,
	`balanceAfter` real NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`referenceId` text,
	`date` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `accountId` text REFERENCES bank_accounts(id);--> statement-breakpoint
ALTER TABLE `expenses` ADD `accountId` text REFERENCES bank_accounts(id);--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD `paymentStatus` text DEFAULT 'unpaid';--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD `accountId` text REFERENCES bank_accounts(id);--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD `grnNumber` text;--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD `paidAt` text;