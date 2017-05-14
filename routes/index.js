const express = require('express');
const router = express.Router();
const devCafeController = require('../controllers/devCafeController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.post('/create', catchErrors(devCafeController.createTopic));
router.post('/startvote', catchErrors(devCafeController.startVote));
router.post('/vote', catchErrors(devCafeController.vote));
router.post('/close', catchErrors(devCafeController.close));

module.exports = router;
