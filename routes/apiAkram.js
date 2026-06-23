var express = require('express');
var router = express.Router();

const apiAkramController = require('../controllers/apiAkramController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/reminders', isAuthenticated, apiAkramController.reminders);
router.get('/attendances', isAuthenticated, apiAkramController.attendances);
router.get('/attendance-recap', isAuthenticated, apiAkramController.attendanceRecap);
router.post('/checkin', isAuthenticated, apiAkramController.checkin);

module.exports = router;