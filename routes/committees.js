const express = require('express');
const router = express.Router();

const committeeController = require('../controllers/committeeController');

router.get('/:eventId', committeeController.committeeDetail);

router.post('/add', committeeController.addCommittee);

module.exports = router;