const express = require("express");
const router = express.Router();
const translationRoute = require("./translation.routes");
const wordsRoute = require("./words.routes");
const reviewRoute = require("./review.routes");
const quizRoute = require("./quiz.routes");

router.use("/translation", translationRoute);
router.use("/words", wordsRoute);
router.use("/review", reviewRoute);
router.use("/quiz", quizRoute);

module.exports = router;
