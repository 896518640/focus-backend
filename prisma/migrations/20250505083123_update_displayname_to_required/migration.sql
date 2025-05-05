/*
  Warnings:

  - Made the column `displayName` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- 先为现有NULL值设置默认值
UPDATE `users` SET `displayName` = CONCAT('FOX_', RIGHT(REPLACE(CAST(UNIX_TIMESTAMP() AS CHAR), '.', ''), 6)) WHERE `displayName` IS NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `displayName` VARCHAR(191) NOT NULL;
