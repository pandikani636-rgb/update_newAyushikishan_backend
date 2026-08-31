const Branch = require('../models/branchModel');
const ErrorHandler = require('../utils/errorHandler');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');

// Create new Branch -- Admin
exports.createBranch = asyncErrorHandler(async (req, res, next) => {
    const branch = await Branch.create(req.body);

    res.status(201).json({
        success: true,
        branch
    });
});

// Get all Branches (Admin)
exports.getAllBranches = asyncErrorHandler(async (req, res, next) => {
    const branches = await Branch.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        branches
    });
});

// Get Branch Details
exports.getBranchDetails = asyncErrorHandler(async (req, res, next) => {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
        return next(new ErrorHandler("Branch not found", 404));
    }

    res.status(200).json({
        success: true,
        branch
    });
});

// Update Branch -- Admin
exports.updateBranch = asyncErrorHandler(async (req, res, next) => {
    let branch = await Branch.findById(req.params.id);

    if (!branch) {
        return next(new ErrorHandler("Branch not found", 404));
    }

    branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        branch
    });
});

// Delete Branch -- Admin
exports.deleteBranch = asyncErrorHandler(async (req, res, next) => {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
        return next(new ErrorHandler("Branch not found", 404));
    }

    await branch.remove();

    res.status(200).json({
        success: true,
        message: "Branch Deleted Successfully"
    });
});
