const express = require("express");
const cloudinary = require("cloudinary").v2;
const app = require("./app");
const connectDatabase = require("./config/database");

const PORT = process.env.PORT || 4000;

// --------------------------------------------------
// Uncaught Exception
// --------------------------------------------------
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

// --------------------------------------------------
// Cloudinary Configuration
// --------------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --------------------------------------------------
// Home Route
// --------------------------------------------------
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is Running! 🚀",
  });
});

// --------------------------------------------------
// Vercel / Production Handler
// --------------------------------------------------
// Every request first connects to MongoDB.
// Only after successful connection the request
// will be passed to Express app.
const handler = async (req, res) => {
  try {
    await connectDatabase();

    return app(req, res);
  } catch (error) {
    console.error("Database Connection Error:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
};

// --------------------------------------------------
// Local Development
// --------------------------------------------------
if (process.env.NODE_ENV !== "production") {
  const startServer = async () => {
    try {
      await connectDatabase();

      const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });

      process.on("unhandledRejection", (err) => {
        console.error("Unhandled Rejection:", err.message);

        server.close(() => {
          process.exit(1);
        });
      });
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  };

  startServer();
}

// --------------------------------------------------
// Export for Vercel
// --------------------------------------------------
module.exports = handler;