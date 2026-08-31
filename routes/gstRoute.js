const express = require('express');
const { createGst, getAllGsts, getGstDetails, updateGst, deleteGst } = require('../controllers/gstController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.route('/gsts').get(getAllGsts);
router.route('/admin/gst/new').post(isAuthenticatedUser, authorizeRoles('admin'), createGst);
router.route('/admin/gst/:id')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getGstDetails)
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateGst)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteGst);

module.exports = router;
