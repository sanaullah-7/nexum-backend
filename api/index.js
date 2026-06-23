const app = require("../src/app");
const { ensureDbConnected } = require("../src/config/db");

module.exports = async (req, res) => {
  try {
    // Ensure the database is connected before handling the request
    await ensureDbConnected(process.env.MONGODB_URI);
  } catch (err) {
    console.error("Database connection error in serverless execution:", err);
  }
  
  // Forward the request to the Express application
  return app(req, res);
};
