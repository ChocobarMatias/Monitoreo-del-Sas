const { Router } = require("express");
const {
  forgotPasswordController,
  loginController,
  registerUserByAdminController,
  setPinController,
  validatePinController,
  resetPasswordController
} = require("./auth.controller");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { roleMiddleware } = require("../../middlewares/roleMiddleware");
const { forgotPasswordLimiter, loginLimiter, resetPasswordLimiter } = require("../../middlewares/rateLimiters");

const router = Router();

router.post("/login", loginLimiter, loginController);
router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordController);
router.post("/reset-password", resetPasswordLimiter, resetPasswordController);

router.post(
  "/users",
  authMiddleware,
  roleMiddleware("ADMIN"),
  registerUserByAdminController
);

router.post("/set-pin", authMiddleware, setPinController);
router.post("/validate-pin", authMiddleware, validatePinController);

module.exports = router;
