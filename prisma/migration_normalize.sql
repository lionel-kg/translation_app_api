-- ============================================
-- Migration: Normalize Word → Word + UserWord
-- Word becomes shared, UserWord holds per-user progress
-- ============================================

-- 1. Create UserWord table
CREATE TABLE IF NOT EXISTS `UserWord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `wordId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Nouveau',
    `nextReviewDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `interval` INTEGER NOT NULL DEFAULT 0,
    `easeFactor` DOUBLE NOT NULL DEFAULT 2.5,
    `repetitions` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `UserWord_userId_wordId_key`(`userId`, `wordId`),
    INDEX `UserWord_userId_nextReviewDate_idx`(`userId`, `nextReviewDate`),
    CONSTRAINT `UserWord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `UserWord_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `Word`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Migrate existing per-user SM-2 data from Word to UserWord
INSERT INTO `UserWord` (`userId`, `wordId`, `status`, `nextReviewDate`, `interval`, `easeFactor`, `repetitions`, `createdAt`, `updatedAt`)
SELECT `userId`, `id`, `status`, `nextReviewDate`, `interval`, `easeFactor`, `repetitions`, `createdAt`, `updatedAt`
FROM `Word`
WHERE `userId` IS NOT NULL;

-- 3. Deduplicate Word table: keep only one row per expression
-- First, create a temp table with the IDs to keep (lowest id per expression)
CREATE TEMPORARY TABLE `_word_keep` AS
SELECT MIN(`id`) AS `keep_id`, `expression`
FROM `Word`
GROUP BY `expression`;

-- 4. Update UserWord references to point to the kept word IDs
UPDATE `UserWord` uw
INNER JOIN `Word` w ON uw.`wordId` = w.`id`
INNER JOIN `_word_keep` wk ON w.`expression` = wk.`expression`
SET uw.`wordId` = wk.`keep_id`
WHERE w.`id` != wk.`keep_id`;

-- 5. Update QuizQuestion references to point to kept word IDs
UPDATE `QuizQuestion` qq
INNER JOIN `Word` w ON qq.`wordId` = w.`id`
INNER JOIN `_word_keep` wk ON w.`expression` = wk.`expression`
SET qq.`wordId` = wk.`keep_id`
WHERE w.`id` != wk.`keep_id`;

-- 6. Remove duplicate UserWord entries (same userId+wordId after remap)
-- Keep the one with the most progress (highest repetitions)
DELETE uw1 FROM `UserWord` uw1
INNER JOIN `UserWord` uw2
ON uw1.`userId` = uw2.`userId`
AND uw1.`wordId` = uw2.`wordId`
AND uw1.`id` > uw2.`id`
WHERE uw1.`repetitions` <= uw2.`repetitions`;

-- 7. Drop foreign key from Word to User before removing userId
ALTER TABLE `Word` DROP FOREIGN KEY `Word_userId_fkey`;

-- 8. Drop indexes that reference userId
ALTER TABLE `Word` DROP INDEX `Word_userId_expression_key`;
ALTER TABLE `Word` DROP INDEX `Word_userId_nextReviewDate_idx`;

-- 9. Remove per-user and SM-2 columns from Word
ALTER TABLE `Word` DROP COLUMN `userId`;
ALTER TABLE `Word` DROP COLUMN `status`;
ALTER TABLE `Word` DROP COLUMN `nextReviewDate`;
ALTER TABLE `Word` DROP COLUMN `interval`;
ALTER TABLE `Word` DROP COLUMN `easeFactor`;
ALTER TABLE `Word` DROP COLUMN `repetitions`;

-- 10. Delete duplicate Word rows (keep only the lowest id per expression)
DELETE w FROM `Word` w
LEFT JOIN `_word_keep` wk ON w.`id` = wk.`keep_id`
WHERE wk.`keep_id` IS NULL;

-- 11. Add unique constraint on expression
ALTER TABLE `Word` ADD UNIQUE INDEX `Word_expression_key`(`expression`);

-- 12. Cleanup
DROP TEMPORARY TABLE IF EXISTS `_word_keep`;
