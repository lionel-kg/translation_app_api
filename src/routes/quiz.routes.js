const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quiz.controller");

router.post("/generate", quizController.generate);
router.get("/history", quizController.getHistory);
router.get("/:id", quizController.getOne);
router.get("/:id/results", quizController.getCompleted);
router.post("/:questionId/answer", quizController.submitAnswer);

module.exports = router;
