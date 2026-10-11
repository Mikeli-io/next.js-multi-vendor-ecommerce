-- AlterTable
ALTER TABLE `coupons` ADD COLUMN `appliesTo` ENUM('ALL_PRODUCTS', 'SPECIFIC_PRODUCTS') NOT NULL DEFAULT 'ALL_PRODUCTS';

-- CreateTable
CREATE TABLE `coupon_products` (
    `couponId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `coupon_products_productId_idx`(`productId`),
    PRIMARY KEY (`couponId`, `productId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `coupon_products` ADD CONSTRAINT `coupon_products_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_products` ADD CONSTRAINT `coupon_products_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
