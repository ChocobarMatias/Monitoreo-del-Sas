const { Router } = require("express");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { roleMiddleware } = require("../../middlewares/roleMiddleware");
const { listUsersController, updateUserController, listGruposController } = require("./users.controller");

const router = Router();

router.use(authMiddleware);

router.get("/me", (req, res) => {
  res.json({ ok: true, user: req.user });
});

router.get("/grupos", roleMiddleware("ADMIN"), listGruposController);
router.get("/", roleMiddleware("ADMIN"), listUsersController);
router.put("/:id", roleMiddleware("ADMIN"), updateUserController);

module.exports = router;
