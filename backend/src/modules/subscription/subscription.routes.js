const { Router } = require("express");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const { roleMiddleware } = require("../../middlewares/roleMiddleware");
const {
  getStatusController,
  getHistoryController,
  activateSubscriptionController,
  getAliasController,
} = require("./subscription.controller");

const router = Router();

router.use(authMiddleware);

router.get("/status",   getStatusController);
router.get("/history",  getHistoryController);
router.get("/alias",    getAliasController);
router.post("/activate/:userId", roleMiddleware("ADMIN"), activateSubscriptionController);

module.exports = router;
