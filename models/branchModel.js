const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter branch name"],
        trim: true
    },
    address: {
        type: String,
        required: [true, "Please enter branch address"]
    },
    phone: {
        type: String,
        required: [true, "Please enter branch phone number"]
    },
    email: {
        type: String,
        required: [true, "Please enter branch email address"]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Branch', branchSchema);
