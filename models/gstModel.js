const mongoose = require('mongoose');

const gstSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter GST name"],
        trim: true,
        unique: true
    },
    percentage: {
        type: Number,
        required: [true, "Please enter GST percentage"],
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Gst', gstSchema);
