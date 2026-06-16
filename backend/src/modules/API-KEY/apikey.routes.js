
const { Router } = require("express");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { createApiKeyController } = require("./apikey.controller");

const router = Router();

router.post("/", authMiddleware, createApiKeyController);

module.exports = router;
