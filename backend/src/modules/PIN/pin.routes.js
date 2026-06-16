
const { Router } = require("express");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { setPinService } = require("./pin.service");

const router = Router();

router.post("/set", authMiddleware, async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin || typeof pin !== "string" || pin.length < 4) {
      return res.status(400).json({ ok: false, message: "PIN inválido" });
    }
    const data = await setPinService(req.user.id, pin);
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
