const Video = require('../models/videoModel');
const ErrorHandler = require('../utils/errorHandler');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const cloudinary = require('cloudinary');
const fs = require('fs');

// Create New Video -- Admin
exports.addVideo = asyncErrorHandler(async (req, res, next) => {
    const { title, type } = req.body;
    let url = req.body.url;
    let public_id = undefined;

    // If it's a local video upload, upload to Cloudinary
    if (type === 'video' && req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path, { resource_type: "video", folder: "videos" });
        url = result.secure_url;
        public_id = result.public_id;
        
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    const video = await Video.create({
        title,
        type,
        url,
        public_id
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

    if (video.public_id) {
        await cloudinary.v2.uploader.destroy(video.public_id, { resource_type: "video" });
    }

    await video.deleteOne();

    res.status(200).json({
        success: true,
        message: "Video Deleted Successfully"
    });
});
