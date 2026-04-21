/**
 * Routes réservées à l'agent n8n.
 * Protégées par agentAuth (x-agent-key header).
 *
 * Ces routes n'ont pas de req.user — elles opèrent
 * sur un userId passé dans le body ou en paramètre.
 */
const express = require("express");
const router = express.Router();
const translationService = require("../services/translation.service");
const wordsService = require("../services/words.service");

// Créer une translation pour un user donné
// Body: { userId, title, textContent, vocabularyUsed, difficultyLevel, coachNotes }
router.post("/translations", async (req, res) => {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const translation = await translationService.createTranslation(data, userId);
    res.status(201).json(translation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Importer des mots en batch
// Body: { words: [{ expression, type, definition, example }] }
router.post("/words/batch", async (req, res) => {
  try {
    const { words } = req.body;
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: "words array is required" });
    }
    const result = await wordsService.createBatchWords(words);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un mot unique
// Body: { expression, type, definition, example }
router.post("/words", async (req, res) => {
  try {
    const word = await wordsService.createWord(req.body);
    res.status(201).json(word);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
