const Banner = require('../models/bannerModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const fs = require('fs');
const path = require('path');

// Get All Active Banners (Public)
exports.getBanners = asyncErrorHandler(async (req, res, next) => {
    const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        banners,
    });
});

// Get All Banners (Admin)
exports.getAdminBanners = asyncErrorHandler(async (req, res, next) => {
    const banners = await Banner.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        banners,
    });
});

// Get Banner Details (Admin)
exports.getBannerDetails = asyncErrorHandler(async (req, res, next) => {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        return next(new ErrorHandler("Banner Not Found", 404));
    }

    res.status(200).json({
        success: true,
        banner,
    });
});

// Create New Banner (Admin)
exports.createBanner = asyncErrorHandler(async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new ErrorHandler("Please upload a banner image", 400));
        }

        const bannerData = {
            title: req.body.title,
            subtitle: req.body.subtitle,
            isActive: req.body.isActive === 'true' || req.body.isActive === true,
            image: {
                public_id: req.file.filename,
                url: `uploads/${req.file.filename}`
            }
        };

        const banner = await Banner.create(bannerData);

        res.status(201).json({
            success: true,
            banner
        });
    } catch (error) {
        // Cleanup uploaded file if creation fails
        if (req.file) {
            const filePath = path.join(__dirname, "../uploads", req.file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        return next(new ErrorHandler(error.message, 500));
    }
});

// Update Banner (Admin)
exports.updateBanner = asyncErrorHandler(async (req, res, next) => {
    let banner = await Banner.findById(req.params.id);

    if (!banner) {
        return next(new ErrorHandler("Banner Not Found", 404));
    }

    const updatedData = {
        title: req.body.title || banner.title,
        subtitle: req.body.subtitle || banner.subtitle,
    };
    
    // Explicitly check for isActive property as it's a boolean and can be false
    if (req.body.isActive !== undefined) {
        updatedData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }

    // Handle Image Update
    if (req.file) {
        // Delete old image from uploads folder
        const oldImagePath = path.join(__dirname, "../", banner.image.url);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);

        // Add new image
        updatedData.image = {
            public_id: req.file.filename,
            url: `uploads/${req.file.filename}`
        };
    }

    banner = await Banner.findByIdAndUpdate(req.params.id, updatedData, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        banner
    });
});

// Delete Banner (Admin)
exports.deleteBanner = asyncErrorHandler(async (req, res, next) => {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        return next(new ErrorHandler("Banner Not Found", 404));
    }

    // Delete image from local uploads
    if (banner.image && banner.image.url) {
        const imagePath = path.join(__dirname, "../", banner.image.url);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await banner.deleteOne();

    res.status(200).json({
        success: true,
        message: "Banner Deleted Successfully"
    });
});
