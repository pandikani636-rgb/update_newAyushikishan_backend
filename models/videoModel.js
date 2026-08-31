const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please enter video title"],
        trim: true,
    },
    type: {
        type: String,
        required: [true, "Please select video type"],
        enum: ['youtube', 'video'],
        default: 'youtube'
    },
    url: {
        type: String,
        required: [true, "Please enter video URL"],
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Video', videoSchema);
