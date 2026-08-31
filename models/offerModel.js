const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter offer name'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please enter offer description'],
    },
    discountType: {
        type: String,
        required: [true, 'Please select discount type'],
        enum: ['percentage', 'fixed'],
    },
    offerType: {
        type: String,
        required: [true, 'Please select offer type'],
        enum: ['seasonal', 'combo', 'role_based', 'general'],
        default: 'general'
    },
    value: {
        type: Number,
        required: [true, 'Please enter offer value'],
    },
    applicableRoles: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Role'
        }
    ],
    applicableProducts: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Product'
        }
    ],
    minPurchaseAmount: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide end date']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Offer', offerSchema);
