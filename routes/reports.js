const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");
const { uploadReport } = require("../middlewares/upload");
const { checkPermission } = require("../middlewares/acl");

router.get("/", checkPermission(['manage_reports', 'view_reports']), reportsController.index);
router.get("/upload", checkPermission('manage_reports'), reportsController.uploadPage);
router.post("/upload", checkPermission('manage_reports'), uploadReport.single("report_file"), reportsController.store);

module.exports = router;