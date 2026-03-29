
const { Router } = require("express");

const { authMiddleware } = require("../../middlewares/authMiddleware");
const { calculateSalaryController } = require("./keys.controller");
const router = Router();

router.get("/", (_req, res) => {
  res.json({ ok: true, message: "Keys module pendiente" });
});
router.post("/calculate", authMiddleware, calculateSalaryController);
module.exports = router;