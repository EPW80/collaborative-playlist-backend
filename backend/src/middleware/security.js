const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

/**
 * Configure security middleware for the Express app
 * @param {import('express').Application} app - Express application instance
 */
module.exports = (app) => {
  // Set security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Compress responses
  app.use(compression());

  // Prevent NoSQL injection attacks
  app.use(mongoSanitize());

  // Prevent XSS attacks
  app.use(xss());

  // Logging middleware
  if (process.env.NODE_ENV === "production") {
    app.use(morgan("combined"));
  } else {
    app.use(morgan("dev"));
  }

  // Disabled rate limiting in development to prevent CORS/429 issues
  if (process.env.NODE_ENV === "production") {
    // General rate limiting
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
      message: {
        error: "Too many requests from this IP, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
      trustProxy: false,
    });

    app.use("/api/", generalLimiter);

    // Auth rate limiting
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // requests per window
      message: {
        error: "Too many authentication attempts, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
      trustProxy: false,
    });

    app.use("/api/auth/", authLimiter);
  }
};
