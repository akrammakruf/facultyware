var express = require('express');
var router = express.Router();
const adminController = require('../controllers/adminController');
const { checkPermission } = require('../middlewares/acl');

router.get('/events', checkPermission('manage_events'), adminController.listEvents);
router.post('/events/add', checkPermission('manage_events'), adminController.addEvent);
router.post('/events/publish/:id', checkPermission('manage_events'), adminController.publishEvent);
router.post('/events/delete/:id', checkPermission('manage_events'), adminController.deleteEvent);
router.get('/api/committee/:id', checkPermission('manage_committee'), adminController.apiCommittee);
router.get('/api/events/active', checkPermission('manage_events'), adminController.apiActiveEvents);
router.get('/api/events/deleted', checkPermission('manage_events'), adminController.apiDeletedEvents);
router.get('/panitia/export/:id', checkPermission('manage_committee'), adminController.exportExcel);

module.exports = router;