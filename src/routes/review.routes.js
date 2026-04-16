const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");

router.get("/due", reviewController.getDueWords);
router.post("/:id/review", reviewController.submitReview);

module.exports = router;
