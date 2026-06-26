const express = require('express');
const router = express.Router();
const registrationsController = require('../controllers/registrationsController');
const { checkPermission } = require('../middlewares/acl');

// List event yang tersedia
router.get('/', checkPermission('view_events'), registrationsController.index);

// Detail event
router.get('/:id', checkPermission('view_events'), registrationsController.detail);

// Form pendaftaran (Harus login)
router.get('/:id/register', checkPermission('register_events'), registrationsController.form);

// Proses pendaftaran (Harus login)
router.post('/:id/register', checkPermission('register_events'), registrationsController.store);

module.exports = router;
