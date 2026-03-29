
const { Router } = require("express");
const router = Router();

router.get("/", (_req, res) => {
  res.json({ ok: true, message: "Salary module pendiente" });
});

module.exports = router;