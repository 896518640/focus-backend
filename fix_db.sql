-- 修复memberships表
ALTER TABLE `memberships` RENAME COLUMN `type` TO `level`;
ALTER TABLE `memberships` ADD COLUMN `nextResetTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `memberships` ADD COLUMN `totalMinutes` INTEGER NOT NULL DEFAULT 90;
ALTER TABLE `memberships` ADD COLUMN `usedMinutes` INTEGER NOT NULL DEFAULT 0;

-- 修复usage_stats表
ALTER TABLE `usage_stats` ADD COLUMN `transcribeMinutesUsed` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `usage_stats` ADD COLUMN `translateMinutesUsed` INTEGER NOT NULL DEFAULT 0;

-- 修复user_settings表
ALTER TABLE `user_settings` ADD COLUMN `translationEnabled` BOOLEAN NOT NULL DEFAULT true; 