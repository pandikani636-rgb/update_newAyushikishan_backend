const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/flipkart";

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDatabase = () => {
    if (cached.conn) {
        console.log("Using cached Mongoose connection");
        return cached.conn;
    }

    if (!cached.promise) {
        console.log("Creating new Mongoose connection...");
        cached.promise = mongoose.connect(MONGO_URI, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            maxPoolSize: 10, // Limit connections to prevent MongoDB Free Tier exhaustion
            serverSelectionTimeoutMS: 5000 
        }).then((mongoose) => {
            console.log("Mongoose Connected Successfully");
            return mongoose;
        }).catch((err) => {
            console.error("MongoDB Connection Error: ", err);
            cached.promise = null;
        });
    }

    cached.conn = cached.promise;
    return cached.conn;
}

module.exports = connectDatabase;