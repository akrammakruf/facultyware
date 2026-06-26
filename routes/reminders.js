var express = require('express');
var router = express.Router();

const remindersController = require('../controllers/remindersController');
const { checkPermission } = require('../middlewares/acl');

router.get('/', checkPermission('manage_reminders'), remindersController.index);
router.post('/send', checkPermission('manage_reminders'), remindersController.send);
router.get('/history', checkPermission('manage_reminders'), remindersController.history);

module.exports = router;