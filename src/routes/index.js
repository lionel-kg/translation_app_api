const express = require("express");
const router = express.Router();
const translationRoute = require("./translation.routes");
const wordsRoute = require("./words.routes");
const reviewRoute = require("./review.routes");
const quizRoute = require("./quiz.routes");
const dashboardRoute = require("./dashboard.routes");

router.use("/translation", translationRoute);
router.use("/words", wordsRoute);
router.use("/review", reviewRoute);
router.use("/quiz", quizRoute);
router.use("/dashboard", dashboardRoute);

module.exports = router;
