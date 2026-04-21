const prisma = require("../utils/prisma");

exports.getDashboardStats = async (userId) => {
  const now = new Date();

  const [
    totalWords,
    wordsDueForReview,
    pendingTranslations,
    completedTranslations,
    recentBestQuiz,
    activityDates,
  ] = await Promise.all([
    prisma.userWord.count({ where: { userId } }),

    prisma.userWord.count({
      where: { userId, nextReviewDate: { lte: now } },
    }),

    prisma.translation.count({
      where: { userId, OR: [{ traduction: null }, { traduction: "" }] },
    }),

    prisma.translation.count({
      where: { userId, traduction: { not: null }, NOT: { traduction: "" } },
    }),

    prisma.quiz.findFirst({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      select: { id: true, score: true, totalItems: true, type: true, completedAt: true },
    }),

    prisma.quiz.findMany({
      where: { userId, completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  const reviewDates = await prisma.userWord.findMany({
    where: { userId, repetitions: { gt: 0 } },
    select: { updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const streak = calculateStreak(activityDates, reviewDates);

  return {
    totalWords,
    wordsDueForReview,
    pendingTranslations,
    completedTranslations,
    streak,
    recentBestQuiz: recentBestQuiz
      ? {
          id: recentBestQuiz.id,
          score: recentBestQuiz.score,
          totalItems: recentBestQuiz.totalItems,
          type: recentBestQuiz.type,
          completedAt: recentBestQuiz.completedAt,
          percentage: recentBestQuiz.totalItems > 0
            ? Math.round((recentBestQuiz.score / recentBestQuiz.totalItems) * 100)
            : 0,
        }
      : null,
  };
};

function calculateStreak(quizActivity, reviewActivity) {
  const dateSet = new Set();
  for (const q of quizActivity) {
    if (q.completedAt) dateSet.add(toDateString(q.completedAt));
  }
  for (const r of reviewActivity) {
    if (r.updatedAt) dateSet.add(toDateString(r.updatedAt));
  }
  if (dateSet.size === 0) return 0;

  let streak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  while (dateSet.has(toDateString(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

function toDateString(date) {
  const d = new Date(date);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
