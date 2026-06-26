var express = require('express');
var router = express.Router();

const checkinsController = require('../controllers/checkinsController');
const { checkPermission } = require('../middlewares/acl');

router.get('/', checkPermission('checkin_participants'), checkinsController.index);
router.post('/process', checkPermission('checkin_participants'), checkinsController.process);

module.exports = router;