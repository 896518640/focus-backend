/*
  Warnings:

  - Added the required column `duration` to the `translations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `translations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `translations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `translations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `translations` ADD COLUMN `duration` DOUBLE NOT NULL,
    ADD COLUMN `errorMessage` VARCHAR(191) NULL,
    ADD COLUMN `outputMp3Path` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'success',
    ADD COLUMN `tags` VARCHAR(191) NULL,
    ADD COLUMN `taskId` VARCHAR(191) NULL,
    ADD COLUMN `taskStatus` VARCHAR(191) NULL,
    ADD COLUMN `timestamp` BIGINT NOT NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
