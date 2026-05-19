const { Router } = require("express");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { calculateSalaryController } = require("./salary.controller");

const router = Router();

router.get("/", (_req, res) => {
  res.json({ ok: true, message: "Salary module activo" });
});

router.post("/calculate", authMiddleware, calculateSalaryController);

module.exports = router;
