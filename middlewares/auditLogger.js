const AuditLog = require('../models/auditLogModel');

exports.auditLogger = async (req, res, next) => {
    // Only log modifying actions on admin routes
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.originalUrl.includes('/api/v1/admin/')) {
        
        // Don't log the audit logs route itself
        if (req.originalUrl.includes('/admin/logs')) {
            return next();
        }

        // We listen for the response to finish so we know if the action was successful
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    // Scrub sensitive fields
                    const scrubbedBody = { ...req.body };
                    if (scrubbedBody.password) delete scrubbedBody.password;
                    if (scrubbedBody.confirmPassword) delete scrubbedBody.confirmPassword;

                    // Determine Action String
                    let actionStr = 'UNKNOWN';
                    if (req.method === 'POST') actionStr = 'CREATE';
                    if (req.method === 'PUT') actionStr = 'UPDATE';
                    if (req.method === 'DELETE') actionStr = 'DELETE';

                    // Extract Entity Name from URL
                    // Example: /api/v1/admin/product/new -> product
                    // Example: /api/v1/admin/user/123 -> user
                    const urlParts = req.originalUrl.split('?')[0].split('/');
                    const adminIndex = urlParts.indexOf('admin');
                    let entityName = 'System';
                    if (adminIndex !== -1 && urlParts.length > adminIndex + 1) {
                        entityName = urlParts[adminIndex + 1];
                    }

                    await AuditLog.create({
                        user: req.user ? req.user._id : null,
                        action: actionStr,
                        entity: entityName.toUpperCase(),
                        url: req.originalUrl,
                        details: scrubbedBody,
                        ipAddress: req.ip || req.connection.remoteAddress
                    });
                } catch (error) {
                    console.error("Audit log error:", error);
                }
            }
        });
    }
    next();
};
