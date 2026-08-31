const AuditLog = require('../models/auditLogModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');

// Get all audit logs -- Admin
exports.getAllLogs = asyncErrorHandler(async (req, res, next) => {
    // We populate the user details so the admin can see who did what
    const logs = await AuditLog.find()
        .populate('user', 'name email role')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        logs
    });
});
