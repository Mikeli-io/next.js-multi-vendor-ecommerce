-- CreateTable
CREATE TABLE `coupons` (
    `id` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `type` ENUM('DISCOUNT_ON_PURCHASE', 'FREE_DELIVERY', 'FIRST_ORDER') NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `discountType` ENUM('AMOUNT', 'PERCENTAGE') NULL,
    `discount` DECIMAL(10, 2) NULL,
    `maxDiscount` DECIMAL(10, 2) NULL,
    `minPurchase` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `limitPerUser` INTEGER NOT NULL,
    `startDate` DATE NOT NULL,
    `expireDate` DATE NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `coupons_code_key`(`code`),
    INDEX `coupons_vendorId_idx`(`vendorId`),
    INDEX `coupons_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `coupons` ADD CONSTRAINT `coupons_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
