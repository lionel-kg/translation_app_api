const express = require("express");
const router = express.Router();
const wordController = require("../controllers/words.controller");

// Create one
router.post("/", wordController.create);

// Import Batch (Pour ta liste JSON)
router.post("/batch", wordController.importBatch);

// Read All
router.get("/", wordController.findAll);

// Read One
router.get("/:id", wordController.findOne);

// Update Status
router.put("/:id/status", wordController.updateStatus);

// Delete
router.delete("/:id", wordController.delete);

module.exports = router;
