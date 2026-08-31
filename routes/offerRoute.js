const express = require('express');
const {
    createOffer,
    getAdminOffers,
    getOfferDetails,
    updateOffer,
    deleteOffer
} = require('../controllers/offerController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.route('/admin/offer/new').post(isAuthenticatedUser, authorizeRoles('admin'), createOffer);
router.route('/admin/offers').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminOffers);
router.route('/admin/offer/:id')
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateOffer)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOffer)
    .get(isAuthenticatedUser, authorizeRoles('admin'), getOfferDetails);

router.route('/offers').get(getAdminOffers); // Assuming public list might be needed later, otherwise this should be restricted too. For now keeping it simple.

module.exports = router;
