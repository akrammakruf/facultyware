const express = require('express');
const router = express.Router();
const ticketsController = require('../controllers/ticketsController');
const { checkPermission } = require('../middlewares/acl');

// Lihat tiket (Harus login)
router.get('/:ticketNumber', checkPermission(['view_tickets', 'view_own_tickets']), ticketsController.show);

// Download tiket (Harus login)
router.get('/:ticketNumber/download', checkPermission(['view_tickets', 'download_own_tickets']), ticketsController.download);

module.exports = router;
