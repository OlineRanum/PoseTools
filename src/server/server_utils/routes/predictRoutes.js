// server_utils/routes/predictRoutes.js
const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');

router.post('/handshapes', predictController.predictHandshapes);

module.exports = router;
