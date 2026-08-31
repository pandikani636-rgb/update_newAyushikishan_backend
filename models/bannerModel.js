const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please enter banner title"],
        trim: true
    },
    subtitle: {
        type: String,
        required: [true, "Please enter banner subtitle"]
    },
    image: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
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

module.exports = mongoose.model('Banner', bannerSchema);
