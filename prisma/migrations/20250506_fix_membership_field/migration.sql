-- AlterTable: 将memberships表中的type字段重命名为level
ALTER TABLE `memberships` RENAME COLUMN `type` TO `level`;

-- AlterTable: 添加新的字段到memberships表
ALTER TABLE `memberships` ADD COLUMN `nextResetTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `memberships` ADD COLUMN `totalMinutes` INTEGER NOT NULL DEFAULT 90;
ALTER TABLE `memberships` ADD COLUMN `usedMinutes` INTEGER NOT NULL DEFAULT 0;

-- AlterTable: 添加新的使用统计字段到usage_stats表
ALTER TABLE `usage_stats` ADD COLUMN `transcribeMinutesUsed` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `usage_stats` ADD COLUMN `translateMinutesUsed` INTEGER NOT NULL DEFAULT 0;

-- AlterTable: 添加翻译功能开关到user_settings表
ALTER TABLE `user_settings` ADD COLUMN `translationEnabled` BOOLEAN NOT NULL DEFAULT true; 