const express = require('express');
const router = express.Router();
const devCafeController = require('../controllers/devCafeController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.post('/create', catchErrors(devCafeController.createTopic));
router.post('/startvote', devCafeController.startVote);
router.post('/vote', devCafeController.vote);

module.exports = router;
