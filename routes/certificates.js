const express = require("express");
const router = express.Router();
const certificatesController = require("../controllers/certificatesController");
const { checkPermission } = require("../middlewares/acl");

router.get("/", checkPermission(['manage_certificates', 'view_certificates', 'view_own_certificates']), certificatesController.index);
router.get("/:id", checkPermission(['manage_certificates', 'view_certificates', 'preview_own_certificates', 'download_own_certificates']), certificatesController.show);

module.exports = router;