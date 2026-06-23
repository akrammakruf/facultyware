const express = require('express');
const router = express.Router();

const eventsController = require('../controllers/eventsController');

router.get('/', eventsController.listEvents);

router.post('/add', eventsController.addEvent);

router.post('/update/:id', eventsController.updateEvent);

router.post('/publish/:id', eventsController.publishEvent);

router.post('/delete/:id', eventsController.deleteEvent);

module.exports = router;