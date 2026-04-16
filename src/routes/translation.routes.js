const express = require("express");
const router = express.Router();
const translationController = require("../controllers/translation.controller");

// Create
router.post("/", translationController.create);

// Read All
router.get("/", translationController.findAll);

// update
router.put("/:id", translationController.update);

// Read One
router.get("/:id", translationController.findOne);

// Delete
router.delete("/:id", translationController.delete);

module.exports = router;
