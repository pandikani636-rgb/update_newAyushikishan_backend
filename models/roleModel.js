const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter role name"],
        unique: true,
        trim: true
    },
    permissions: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Role", roleSchema);
