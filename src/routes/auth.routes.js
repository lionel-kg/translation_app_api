const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { validateRegistration } = require("../middleware/validate.middleware");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/register", validateRegistration, authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", authController.me);

module.exports = router;
