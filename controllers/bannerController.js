const Banner = require('../models/bannerModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary');

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

        const result = await cloudinary.v2.uploader.upload(req.file.path, { folder: "banners" });

        const bannerData = {
            title: req.body.title,
            subtitle: req.body.subtitle,
            isActive: req.body.isActive === 'true' || req.body.isActive === true,
            image: {
                public_id: result.public_id,
                url: result.secure_url
            }
        };

        const banner = await Banner.create(bannerData);

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.status(201).json({
            success: true,
            banner
        });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
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
    
    if (req.body.isActive !== undefined) {
        updatedData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    }

    // Handle Image Update
    if (req.file) {
        if (banner.image && banner.image.public_id) {
            await cloudinary.v2.uploader.destroy(banner.image.public_id);
        }

        const result = await cloudinary.v2.uploader.upload(req.file.path, { folder: "banners" });

        updatedData.image = {
            public_id: result.public_id,
            url: result.secure_url
        };
        
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
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

    if (banner.image && banner.image.public_id) {
        await cloudinary.v2.uploader.destroy(banner.image.public_id);
    }

    await banner.deleteOne();

    res.status(200).json({
        success: true,
        message: "Banner Deleted Successfully"
    });
});
