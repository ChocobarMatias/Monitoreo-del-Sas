
const { Router } = require("express");
const { authMiddleware } = require("../../middlewares/authMiddleware");

const router = Router();

router.get("/me", authMiddleware, (req, res) => {
  res.json({ ok: true, user: req.user });
});

module.exports = router;