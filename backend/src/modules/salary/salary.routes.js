const { Router } = require("express");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { roleMiddleware } = require("../../middlewares/roleMiddleware");
const {
  calculateSalaryController,
  listConveniosController,
  createConvenioController,
} = require("./salary.controller");

const router = Router();

router.get("/", (_req, res) => res.json({ ok: true, message: "Salary module activo" }));

router.post("/calculate", authMiddleware, calculateSalaryController);
router.get("/convenios", authMiddleware, listConveniosController);
router.post("/convenios", authMiddleware, roleMiddleware("ADMIN"), createConvenioController);

module.exports = router;
