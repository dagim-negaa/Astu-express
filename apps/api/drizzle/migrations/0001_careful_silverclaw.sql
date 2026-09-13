PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'user',
	`banned` integer DEFAULT false,
	`banReason` text,
	`banExpires` integer,
	`status` text DEFAULT 'Active' NOT NULL,
	`phone` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "name", "email", "emailVerified", "image", "role", "banned", "banReason", "banExpires", "status", "phone", "createdAt", "updatedAt") SELECT "id", "name", "email", "emailVerified", "image", "role", "banned", "banReason", "banExpires", "status", "phone", "createdAt", "updatedAt" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `account` ADD `issuer` text;--> statement-breakpoint
ALTER TABLE `garments` ADD `storeId` text;--> statement-breakpoint
ALTER TABLE `garments` ADD `buyingPriceEtb` real;--> statement-breakpoint
ALTER TABLE `garments` ADD `profitMargin` real;--> statement-breakpoint
ALTER TABLE `garments` ADD `initialStock` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `garments` ADD `colors` text;--> statement-breakpoint
ALTER TABLE `garments` ADD `sizes` text;--> statement-breakpoint
ALTER TABLE `garments` ADD `materials` text;--> statement-breakpoint
ALTER TABLE `garments` ADD `images` text;--> statement-breakpoint
ALTER TABLE `garments` ADD `is_featured` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `items` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `orderSource` text DEFAULT 'phone' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `storeId` text;--> statement-breakpoint
ALTER TABLE `session` ADD `impersonatedBy` text;