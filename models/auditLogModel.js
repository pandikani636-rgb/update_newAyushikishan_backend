const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    entity: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    details: {
        type: Object,
        default: {},
    },
    ipAddress: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
