var express = require('express');
var router = express.Router();

const attendancesController = require('../controllers/attendancesController');
const { checkPermission } = require('../middlewares/acl');

router.get('/', checkPermission('view_attendance'), attendancesController.index);
router.get('/recap', checkPermission('view_attendance'), attendancesController.recap);
router.get('/export/excel', checkPermission('export_attendance'), attendancesController.exportExcel);

module.exports = router;