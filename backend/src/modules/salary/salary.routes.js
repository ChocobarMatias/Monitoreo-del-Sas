const { Router } = require("express");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const {
  calculateSalaryController,
  listConveniosController,
  createConvenioController,
} = require("./salary.controller");

const router = Router();

router.get("/", (_req, res) => res.json({ ok: true, message: "Salary module activo" }));

router.post("/calculate", authMiddleware, calculateSalaryController);
router.get("/convenios", authMiddleware, listConveniosController);
router.post("/convenios", authMiddleware, createConvenioController);

module.exports = router;
