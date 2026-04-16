const prisma = require("../utils/prisma");

exports.generateQuiz = async (userId, type, count = 10) => {
  // Get user's words with word data
  const allUserWords = await prisma.userWord.findMany({
    where: { userId },
    include: { word: true },
  });

  if (allUserWords.length < 4 && type === "multiple_choice") {
    throw new Error("Need at least 4 words for multiple choice quiz");
  }
  if (allUserWords.length < 1) {
    throw new Error("Need at least 1 word for a quiz");
  }

  const shuffled = allUserWords.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, allUserWords.length));

  const quiz = await prisma.quiz.create({
    data: {
      type,
      totalItems: selected.length,
      userId,
    },
  });

  const questions = [];
  for (const uw of selected) {
    const word = uw.word;
    let questionText, correctAnswer, options;

    if (type === "multiple_choice") {
      questionText = `What is the definition of "${word.expression}"?`;
      correctAnswer = word.definition;
      const wrongOptions = allUserWords
        .filter((w) => w.word.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.word.definition);
      const allOptions = [correctAnswer, ...wrongOptions].sort(
        () => Math.random() - 0.5,
      );
      options = JSON.stringify(allOptions);
    } else {
      const escaped = word.expression.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      const blank = word.example.replace(new RegExp(escaped, "gi"), "______");
      questionText = blank;
      correctAnswer = word.expression;
      options = null;
    }

    const q = await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        wordId: word.id,
        questionText,
        correctAnswer,
        options,
      },
    });
    questions.push(q);
  }

  return { ...quiz, questions };
};

exports.getQuizById = async (quizId, userId) => {
  const quiz = await prisma.quiz.findFirst({
    where: { id: parseInt(quizId), userId },
    include: {
      questions: {
        select: {
          id: true,
          questionText: true,
          options: true,
          userAnswer: true,
          isCorrect: true,
          wordId: true,
        },
      },
    },
  });
  if (!quiz) throw new Error("Quiz not found");

  quiz.questions = quiz.questions.map((q) => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null,
  }));

  return quiz;
};

exports.getCompletedQuiz = async (quizId, userId) => {
  const quiz = await prisma.quiz.findFirst({
    where: { id: parseInt(quizId), userId },
    include: {
      questions: true,
    },
  });
  if (!quiz) throw new Error("Quiz not found");

  quiz.questions = quiz.questions.map((q) => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null,
  }));

  return quiz;
};

exports.submitAnswer = async (questionId, userId, answer) => {
  const question = await prisma.quizQuestion.findUnique({
    where: { id: parseInt(questionId) },
    include: { quiz: true },
  });
  if (!question || question.quiz.userId !== userId) {
    throw new Error("Question not found");
  }

  const isCorrect =
    question.quiz.type === "fill_in_the_blank"
      ? answer.trim().toLowerCase() ===
        question.correctAnswer.trim().toLowerCase()
      : answer === question.correctAnswer;

  const updated = await prisma.quizQuestion.update({
    where: { id: question.id },
    data: { userAnswer: answer, isCorrect },
  });

  const allQuestions = await prisma.quizQuestion.findMany({
    where: { quizId: question.quizId },
  });
  const allAnswered = allQuestions.every((q) => q.userAnswer !== null);

  if (allAnswered) {
    const score = allQuestions.filter((q) => q.isCorrect).length;
    await prisma.quiz.update({
      where: { id: question.quizId },
      data: { score, completedAt: new Date() },
    });
  }

  return { ...updated, isCorrect };
};

exports.getQuizHistory = async (userId) => {
  return prisma.quiz.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });
};
