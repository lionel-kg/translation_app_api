const reviewService = require("../services/review.service");

exports.getDueWords = async (req, res) => {
  try {
    const words = await reviewService.getDueWords(req.user.id);
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitReview = async (req, res) => {
  try {
    const { quality } = req.body;
    const word = await reviewService.submitReview(
      req.params.id,
      req.user.id,
      quality,
    );
    res.json(word);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
