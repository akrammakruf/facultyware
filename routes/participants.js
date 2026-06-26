const express = require("express");
const router = express.Router();
const participantsController = require("../controllers/participantsController");
const { checkPermission } = require("../middlewares/acl");

router.get("/", checkPermission(['manage_participants', 'view_participants']), participantsController.index);
router.get("/:id", checkPermission(['manage_participants', 'view_participants']), participantsController.detail);
router.post("/:id/status", checkPermission('manage_participants'), participantsController.updateStatus);

module.exports = router;