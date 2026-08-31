const Offer = require('../models/offerModel');
const ErrorHandler = require('../utils/errorHandler');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const { createAuditLog } = require('../middlewares/auditLogger');

// Create New Offer -- Admin
exports.createOffer = asyncErrorHandler(async (req, res, next) => {
    const offer = await Offer.create(req.body);
    
    // Audit Log
    createAuditLog(
        req.user._id,
        'CREATE',
        'Offer',
        offer._id,
        null,
        offer,
        req.ip,
        req.headers['user-agent']
    );

    res.status(201).json({
        success: true,
        offer,
    });
});

// Get All Offers -- Admin
exports.getAdminOffers = asyncErrorHandler(async (req, res, next) => {
    const offers = await Offer.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        offers,
    });
});

// Get Single Offer
exports.getOfferDetails = asyncErrorHandler(async (req, res, next) => {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
        return next(new ErrorHandler('Offer not found', 404));
    }

    res.status(200).json({
        success: true,
        offer,
    });
});

// Update Offer -- Admin
exports.updateOffer = asyncErrorHandler(async (req, res, next) => {
    let offer = await Offer.findById(req.params.id);

    if (!offer) {
        return next(new ErrorHandler('Offer not found', 404));
    }

    const oldData = offer.toObject();
    
    offer = await Offer.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    // Audit Log
    createAuditLog(
        req.user._id,
        'UPDATE',
        'Offer',
        offer._id,
        oldData,
        offer,
        req.ip,
        req.headers['user-agent']
    );

    res.status(200).json({
        success: true,
        offer,
    });
});

// Delete Offer -- Admin
exports.deleteOffer = asyncErrorHandler(async (req, res, next) => {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
        return next(new ErrorHandler('Offer not found', 404));
    }

    const oldData = offer.toObject();
    
    await offer.deleteOne();

    // Audit Log
    createAuditLog(
        req.user._id,
        'DELETE',
        'Offer',
        offer._id,
        oldData,
        null,
        req.ip,
        req.headers['user-agent']
    );

    res.status(200).json({
        success: true,
        message: 'Offer deleted successfully',
    });
});
