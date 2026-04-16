const quizService = require("../services/quiz.service");

exports.generate = async (req, res) => {
  try {
    const { type, count } = req.body;
    const quiz = await quizService.generateQuiz(req.user.id, type, count);
    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const quiz = await quizService.getQuizById(req.params.id, req.user.id);
    res.json(quiz);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.getCompleted = async (req, res) => {
  try {
    const quiz = await quizService.getCompletedQuiz(
      req.params.id,
      req.user.id,
    );
    res.json(quiz);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { answer } = req.body;
    const result = await quizService.submitAnswer(
      req.params.questionId,
      req.user.id,
      answer,
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await quizService.getQuizHistory(req.user.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
