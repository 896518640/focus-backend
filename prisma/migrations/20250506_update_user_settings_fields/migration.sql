-- 备份数据
CREATE TEMPORARY TABLE temp_user_settings AS
SELECT 
  id, 
  userId, 
  defaultSourceLanguage as sourceLanguage, 
  defaultTargetLanguage as targetLanguage,
  theme,
  translationEnabled,
  autoTranslate,
  autoSpeak,
  speechRate
FROM user_settings;

-- 删除旧表
DROP TABLE user_settings;

-- 创建新表结构
CREATE TABLE `user_settings` (
  `id` VARCHAR(191) NOT NULL,
  `sourceLanguage` VARCHAR(191) NOT NULL DEFAULT 'cn',
  `targetLanguage` VARCHAR(191) NOT NULL DEFAULT 'en',
  `autoSave` BOOLEAN NOT NULL DEFAULT true,
  `theme` VARCHAR(191) NOT NULL DEFAULT 'system',
  `translationEnabled` BOOLEAN NOT NULL DEFAULT true,
  `userId` VARCHAR(191) NOT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_settings_userId_key`(`userId`),
  CONSTRAINT `user_settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 恢复数据到新表
INSERT INTO user_settings (id, userId, sourceLanguage, targetLanguage, theme, translationEnabled)
SELECT id, userId, sourceLanguage, targetLanguage, theme, translationEnabled
FROM temp_user_settings;

-- 删除临时表
DROP TEMPORARY TABLE temp_user_settings; 