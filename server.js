const path = require('path');
const express = require('express');
const cloudinary = require('cloudinary');
const app = require("./app");
const connectDatabase = require('./config/database');
const PORT = process.env.PORT || 4000;

// UncaughtException Error
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    process.exit(1);
});

connectDatabase();

cloudinary.config({
    cloud_name: "diyou45wc",
    api_key: "752559515634965",
    api_secret: "adxnMIrM8L9NyCXRKGg4OYUEqlQ",
});

app.get('/', (req, res) => {
    res.send('Server is Running! 🚀');
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
});

process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => {
        process.exit(1);
    });
});

module.exports = app;
