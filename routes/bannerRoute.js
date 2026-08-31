const express = require('express');
const { getBanners, getAdminBanners, createBanner, updateBanner, deleteBanner, getBannerDetails } = require('../controllers/bannerController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const upload = require('../middlewares/multer');

const router = express.Router();

router.route('/banners').get(getBanners);

router.route('/admin/banners').get(isAuthenticatedUser, authorizeRoles("admin"), getAdminBanners);

// Note: Using upload.single('image') instead of upload.array('images') because we only need one image per banner
router.post(
    "/admin/banner/new",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    upload.single("image"),
    createBanner
);

router.route('/admin/banner/:id')
    .get(isAuthenticatedUser, authorizeRoles("admin"), getBannerDetails)
    .put(
        isAuthenticatedUser,
        authorizeRoles("admin"),
        upload.single('image'),
        updateBanner
    )
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteBanner);

module.exports = router;
