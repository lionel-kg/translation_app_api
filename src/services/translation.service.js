const prisma = require("../utils/prisma");

exports.createTranslation = async (data, userId) => {
  try {
    const translation = await prisma.translation.create({
      data: {
        title: data.title,
        textContent: data.text_content,
        vocabularyUsed: JSON.stringify(data.vocabulary_used),
        difficultyLevel: data.difficulty_level,
        coachNotes: JSON.stringify(data.coach_notes),
        userId,
      },
    });
    return translation;
  } catch (error) {
    console.log(error);
  }
};

exports.updateTranslation = async (id, userId, data) => {
  try {
    const existing = await prisma.translation.findFirst({
      where: { id: parseInt(id), userId },
    });
    if (!existing) return null;

    const translation = await prisma.translation.update({
      where: { id: existing.id },
      data: {
        traduction: data,
        updatedAt: new Date(),
      },
    });
    return translation;
  } catch (error) {
    console.log(error);
  }
};

exports.getAllTranslations = async (userId) => {
  const translations = await prisma.translation.findMany({
    where: { userId },
  });
  return translations.map((t) => ({
    ...t,
    vocabularyUsed: JSON.parse(t.vocabularyUsed),
    coachNotes: JSON.parse(t.coachNotes),
  }));
};

exports.getTranslationById = async (id, userId) => {
  const translation = await prisma.translation.findFirst({
    where: { id: parseInt(id), userId },
  });
  if (translation) {
    translation.vocabularyUsed = JSON.parse(translation.vocabularyUsed);
    translation.coachNotes = JSON.parse(translation.coachNotes);
  }
  return translation;
};

exports.deleteTranslation = async (id, userId) => {
  const existing = await prisma.translation.findFirst({
    where: { id: parseInt(id), userId },
  });
  if (!existing) return null;
  return await prisma.translation.delete({
    where: { id: existing.id },
  });
};
