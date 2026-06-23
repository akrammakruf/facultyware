const express = require('express');
const router = express.Router();

const exportController = require('../controllers/exportController');

router.get('/excel/:eventId', exportController.exportExcel);

router.get('/pdf/:eventId', exportController.exportPdf);

router.get('/docx/:eventId', exportController.exportDocx);

module.exports = router;