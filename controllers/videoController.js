const Video = require('../models/videoModel');
const ErrorHandler = require('../utils/errorHandler');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');

// Create New Video -- Admin
exports.addVideo = asyncErrorHandler(async (req, res, next) => {
    const { title, type } = req.body;
    let url = req.body.url;

    // If it's a local video upload, construct the relative URL
    if (type === 'video' && req.file) {
        url = `/admin/product/uploads/${req.file.filename}`;
    }

    const video = await Video.create({
        title,
        type,
        url
    });

    res.status(201).json({
        success: true,
        video
    });
});

// Get All Videos
exports.getVideos = asyncErrorHandler(async (req, res, next) => {
    const videos = await Video.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        videos
    });
});

// Delete Video -- Admin
exports.deleteVideo = asyncErrorHandler(async (req, res, next) => {
    const video = await Video.findById(req.params.id);

    if (!video) {
        return next(new ErrorHandler("Video not found", 404));
    }

    await video.deleteOne();

    res.status(200).json({
        success: true,
        message: "Video Deleted Successfully"
    });
});
