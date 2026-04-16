-- ============================================
-- Migration: Add User, Auth, SM-2, Quiz system
-- Preserves existing Word and Translation data
-- ============================================

-- 1. Create User table
CREATE TABLE IF NOT EXISTS `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `User_email_key`(`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Insert a legacy user to own existing data
INSERT INTO `User` (`email`, `password`, `createdAt`, `updatedAt`)
VALUES ('legacy@englishmaster.local', '$2b$12$placeholder_hash_not_for_login', NOW(3), NOW(3));

-- 3. Add userId to Word (nullable first)
ALTER TABLE `Word` ADD COLUMN `userId` INTEGER NULL;

-- 4. Add userId to Translation (nullable first)
ALTER TABLE `Translation` ADD COLUMN `userId` INTEGER NULL;

-- 5. Backfill userId with legacy user (id=1)
UPDATE `Word` SET `userId` = 1 WHERE `userId` IS NULL;
UPDATE `Translation` SET `userId` = 1 WHERE `userId` IS NULL;

-- 6. Make userId NOT NULL
ALTER TABLE `Word` MODIFY COLUMN `userId` INTEGER NOT NULL;
ALTER TABLE `Translation` MODIFY COLUMN `userId` INTEGER NOT NULL;

-- 7. Add SM-2 fields to Word with defaults
ALTER TABLE `Word` ADD COLUMN `nextReviewDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `Word` ADD COLUMN `interval` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `Word` ADD COLUMN `easeFactor` DOUBLE NOT NULL DEFAULT 2.5;
ALTER TABLE `Word` ADD COLUMN `repetitions` INTEGER NOT NULL DEFAULT 0;

-- 8. Drop old unique constraint on expression and add compound unique
ALTER TABLE `Word` DROP INDEX `Word_expression_key`;
ALTER TABLE `Word` ADD UNIQUE INDEX `Word_userId_expression_key`(`userId`, `expression`);

-- 9. Add indexes
ALTER TABLE `Word` ADD INDEX `Word_userId_nextReviewDate_idx`(`userId`, `nextReviewDate`);
ALTER TABLE `Translation` ADD INDEX `Translation_userId_idx`(`userId`);

-- 10. Add foreign keys
ALTER TABLE `Word` ADD CONSTRAINT `Word_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Translation` ADD CONSTRAINT `Translation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 11. Create Quiz table
CREATE TABLE `Quiz` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `totalItems` INTEGER NOT NULL DEFAULT 0,
    `completedAt` DATETIME(3) NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `Quiz_userId_idx`(`userId`),
    CONSTRAINT `Quiz_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 12. Create QuizQuestion table
CREATE TABLE `QuizQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quizId` INTEGER NOT NULL,
    `wordId` INTEGER NOT NULL,
    `questionText` TEXT NOT NULL,
    `correctAnswer` VARCHAR(191) NOT NULL,
    `options` TEXT NULL,
    `userAnswer` VARCHAR(191) NULL,
    `isCorrect` BOOLEAN NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `QuizQuestion_quizId_idx`(`quizId`),
    CONSTRAINT `QuizQuestion_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
