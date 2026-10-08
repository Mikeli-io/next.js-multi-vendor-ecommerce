-- AlterTable
ALTER TABLE `vendors` ADD COLUMN `address` VARCHAR(100) NULL,
    ADD COLUMN `coverImage` VARCHAR(191) NULL,
    ADD COLUMN `image` VARCHAR(191) NULL,
    ADD COLUMN `logo` VARCHAR(191) NULL,
    ADD COLUMN `tinCertificate` VARCHAR(191) NULL,
    ADD COLUMN `tinExpireDate` DATE NULL,
    ADD COLUMN `tinNumber` VARCHAR(30) NULL;
