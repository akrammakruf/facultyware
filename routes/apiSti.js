const express = require('express');
const router = express.Router();

const apiSitiController =
    require('../controllers/apiSitiController');

router.get(
    '/committee/:eventId',
    apiSitiController.getCommittee
);

router.post(
    '/committee',
    apiSitiController.addCommittee
);

router.put(
    '/committee/:id',
    apiSitiController.updateCommittee
);

router.delete(
    '/committee/:id',
    apiSitiController.deleteCommittee
);

module.exports = router;