const express = require('express');
const router = express.Router();
const devCafeController = require('../controllers/devCafeController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.post('/create', devCafeController.createTopic);
router.post('/startvote', devCafeController.startVote);
router.post('/vote', devCafeController.vote);
router.post('/close', devCafeController.close);

module.exports = router;
