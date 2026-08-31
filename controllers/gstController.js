const Gst = require("../models/gstModel");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const ErrorHandler = require("../utils/errorHandler");

// Create GST ---ADMIN
exports.createGst = asyncErrorHandler(async (req, res, next) => {
    const { name, percentage } = req.body;

    if (!name || percentage === undefined) {
        return next(new ErrorHandler("Name and percentage are required", 400));
    }

    const gst = await Gst.create({
        name,
        percentage
    });

    res.status(201).json({
        success: true,
        gst,
    });
});

// Get All GSTs
exports.getAllGsts = asyncErrorHandler(async (req, res, next) => {
    const gsts = await Gst.find();
    res.status(200).json({
        success: true,
        gsts
    });
});

// Get Single GST
exports.getGstDetails = asyncErrorHandler(async (req, res, next) => {
    const gst = await Gst.findById(req.params.id);

    if (!gst) {
        return next(new ErrorHandler("GST not found", 404));
    }

    res.status(200).json({
        success: true,
        gst,
    });
});

// Update GST ---ADMIN
exports.updateGst = asyncErrorHandler(async (req, res, next) => {
    let gst = await Gst.findById(req.params.id);

    if (!gst) {
        return next(new ErrorHandler("GST not found", 404));
    }

    gst = await Gst.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        gst,
    });
});

// Delete GST ---ADMIN
exports.deleteGst = asyncErrorHandler(async (req, res, next) => {
    const gst = await Gst.findById(req.params.id);

    if (!gst) {
        return next(new ErrorHandler("GST not found", 404));
    }

    await gst.remove();

    res.status(200).json({
        success: true,
        message: "GST deleted successfully"
    });
});
