const prisma = require("../utils/prisma");

/**
 * SM-2 Algorithm Implementation.
 *
 * @param {number} quality - User's self-rating 0-5
 * @param {number} repetitions - Current consecutive correct count
 * @param {number} easeFactor - Current ease factor (>= 1.3)
 * @param {number} interval - Current interval in days
 * @returns {{ repetitions, easeFactor, interval, nextReviewDate }}
 */
exports.calculateSM2 = (quality, repetitions, easeFactor, interval) => {
  let newRepetitions, newInterval, newEaseFactor;

  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 0;
  } else {
    newRepetitions = repetitions + 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
  }

  newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + (newInterval || 0));

  return {
    repetitions: newRepetitions,
    easeFactor: parseFloat(newEaseFactor.toFixed(2)),
    interval: newInterval,
    nextReviewDate,
  };
};

exports.getDueWords = async (userId) => {
  const now = new Date();
  const userWords = await prisma.userWord.findMany({
    where: {
      userId,
      nextReviewDate: { lte: now },
    },
    include: { word: true },
    orderBy: { nextReviewDate: "asc" },
  });

  // Flatten for frontend compatibility
  return userWords.map((uw) => ({
    id: uw.word.id,
    userWordId: uw.id,
    expression: uw.word.expression,
    type: uw.word.type,
    definition: uw.word.definition,
    example: uw.word.example,
    status: uw.status,
    nextReviewDate: uw.nextReviewDate,
    interval: uw.interval,
    easeFactor: uw.easeFactor,
    repetitions: uw.repetitions,
  }));
};

exports.submitReview = async (wordId, userId, quality) => {
  if (quality < 0 || quality > 5) {
    throw new Error("Quality must be between 0 and 5");
  }

  const userWord = await prisma.userWord.findFirst({
    where: { wordId: parseInt(wordId), userId },
  });
  if (!userWord) throw new Error("Word not found");

  const result = exports.calculateSM2(
    quality,
    userWord.repetitions,
    userWord.easeFactor,
    userWord.interval,
  );

  return prisma.userWord.update({
    where: { id: userWord.id },
    data: {
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      interval: result.interval,
      nextReviewDate: result.nextReviewDate,
      status: quality >= 3 ? "Révision" : "Nouveau",
    },
  });
};
