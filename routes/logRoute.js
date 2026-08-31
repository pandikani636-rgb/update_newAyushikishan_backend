const express = require('express');
const { getAllLogs } = require('../controllers/logController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

// Admin Route to fetch all logs
router.route('/admin/logs').get(isAuthenticatedUser, authorizeRoles("admin"), getAllLogs);

module.exports = router;
