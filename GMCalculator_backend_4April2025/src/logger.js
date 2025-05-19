const winston = require("winston")

const logger = winston.createLogger({
  level: "info", // Logging level (e.g., info, error, debug)
  format: winston.format.combine(
    winston.format.colorize(), // Add colors to logs
    winston.format.timestamp(), // Add timestamps
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`
    }),
  ),
  transports: [
    new winston.transports.Console(), // Log to console
    new winston.transports.File({ filename: "app.log" }), // Log to a file
  ],
})

module.exports = logger
