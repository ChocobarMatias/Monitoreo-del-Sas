const { Router } = require("express");
const { listKeysController, createKeyController, updateKeyController, deleteKeyController } = require("./keys.controller");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { roleMiddleware } = require("../../middlewares/roleMiddleware");
const router = Router();

router.get("/", authMiddleware, listKeysController);
router.post("/", authMiddleware, createKeyController);
router.put("/:id", authMiddleware, updateKeyController);
router.delete("/:id", authMiddleware, roleMiddleware("ADMIN"), deleteKeyController);

module.exports = router;
