const express = require('express');
const { addVideo, getVideos, deleteVideo } = require('../controllers/videoController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const upload = require('../middlewares/multer');

const router = express.Router();

router.route('/videos').get(getVideos);

router.route('/admin/video/new').post(isAuthenticatedUser, authorizeRoles("admin"), upload.single('videoFile'), addVideo);
router.route('/admin/video/:id').delete(isAuthenticatedUser, authorizeRoles("admin"), deleteVideo);

module.exports = router;
