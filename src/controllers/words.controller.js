const wordService = require("../services/words.service");

exports.create = async (req, res) => {
  try {
    const word = await wordService.createWord(req.body);
    res.status(201).json(word);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.importBatch = async (req, res) => {
  try {
    const result = await wordService.createBatchWords(req.body);
    res.status(201).json({
      message: "Import successful",
      count: result.count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const words = await wordService.getAllWords(req.user.id);
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const word = await wordService.getWordById(req.params.id, req.user.id);
    if (!word) return res.status(404).json({ message: "Word not found" });
    res.json(word);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const word = await wordService.updateWordStatus(
      req.params.id,
      req.user.id,
      status,
    );
    if (!word) return res.status(404).json({ message: "Word not found" });
    res.json(word);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await wordService.deleteWord(req.params.id);
    res.json({ message: "Word deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
