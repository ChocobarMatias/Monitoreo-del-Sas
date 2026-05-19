

const { Router } = require("express");
const { listKeysController, createKeyController, updateKeyController, deleteKeyController, calculateSalaryController } = require("./keys.controller");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const router = Router();

router.get("/", listKeysController);
router.post("/", createKeyController);
router.put("/:id", updateKeyController);
router.delete("/:id", authMiddleware, deleteKeyController);
router.post("/calculate", calculateSalaryController);

module.exports = router;