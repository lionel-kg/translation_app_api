const prisma = require("../utils/prisma");

// Helper: flatten UserWord + Word into a single object for the frontend
const flattenUserWord = (userWord) => ({
  id: userWord.word.id,
  userWordId: userWord.id,
  expression: userWord.word.expression,
  type: userWord.word.type,
  definition: userWord.word.definition,
  example: userWord.word.example,
  status: userWord.status,
  nextReviewDate: userWord.nextReviewDate,
  interval: userWord.interval,
  easeFactor: userWord.easeFactor,
  repetitions: userWord.repetitions,
  createdAt: userWord.word.createdAt,
  updatedAt: userWord.updatedAt,
});

// Create a shared word + UserWord for all existing users
exports.createWord = async (data) => {
  const word = await prisma.word.create({
    data: {
      expression: data.expression,
      type: data.type,
      definition: data.definition,
      example: data.example,
    },
  });

  // Auto-enroll all existing users
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length > 0) {
    await prisma.userWord.createMany({
      data: users.map((u) => ({ userId: u.id, wordId: word.id })),
      skipDuplicates: true,
    });
  }

  return word;
};

// Batch import shared words + UserWord for all users
exports.createBatchWords = async (jsonList) => {
  const formattedData = jsonList.map((item) => ({
    expression: item["Mot/Expression"],
    type: item["Type"],
    definition: item["Définition"],
    example: item["Exemple"],
  }));

  try {
    const result = await prisma.word.createMany({
      data: formattedData,
      skipDuplicates: true,
    });

    // Get all word IDs for the newly inserted expressions
    const expressions = formattedData.map((d) => d.expression);
    const words = await prisma.word.findMany({
      where: { expression: { in: expressions } },
      select: { id: true },
    });

    // Auto-enroll all users for these words
    const users = await prisma.user.findMany({ select: { id: true } });
    if (users.length > 0 && words.length > 0) {
      const userWordData = [];
      for (const user of users) {
        for (const word of words) {
          userWordData.push({ userId: user.id, wordId: word.id });
        }
      }
      await prisma.userWord.createMany({
        data: userWordData,
        skipDuplicates: true,
      });
    }

    return result;
  } catch (error) {
    console.log(error);
  }
};

// Get all words with the user's progress
exports.getAllWords = async (userId) => {
  const userWords = await prisma.userWord.findMany({
    where: { userId },
    include: { word: true },
    orderBy: { word: { createdAt: "desc" } },
  });
  return userWords.map(flattenUserWord);
};

// Get one word with the user's progress
exports.getWordById = async (wordId, userId) => {
  const userWord = await prisma.userWord.findFirst({
    where: { wordId: parseInt(wordId), userId },
    include: { word: true },
  });
  if (!userWord) return null;
  return flattenUserWord(userWord);
};

// Update user's status for a word
exports.updateWordStatus = async (wordId, userId, status) => {
  const userWord = await prisma.userWord.findFirst({
    where: { wordId: parseInt(wordId), userId },
  });
  if (!userWord) return null;
  const updated = await prisma.userWord.update({
    where: { id: userWord.id },
    data: { status },
    include: { word: true },
  });
  return flattenUserWord(updated);
};

// Delete a shared word (cascade deletes all UserWord entries)
exports.deleteWord = async (wordId) => {
  return await prisma.word.delete({
    where: { id: parseInt(wordId) },
  });
};
