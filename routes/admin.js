var express = require('express');
var router = express.Router();
const adminController = require('../controllers/adminController');
const { checkPermission } = require('../middlewares/acl');

router.get('/events', checkPermission('manage_events'), adminController.listEvents);

router.post('/events/add', checkPermission('manage_events'), adminController.addEvent);

router.post('/events/publish/:id', checkPermission('manage_events'), adminController.publishEvent);

router.get('/api/committee/:id', adminController.apiCommittee);

router.get('/panitia/export/:id', adminController.exportExcel);

router.get(
  '/events/create',
  checkPermission('manage_events'),
  adminController.createEventPage
);

router.get(
  '/events/edit/:id',
  checkPermission('manage_events'),
  adminController.editEventPage
);

router.post(
  '/events/update/:id',
  checkPermission('manage_events'),
  adminController.updateEvent
);

module.exports = router;