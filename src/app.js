import fs from "node:fs";
import createError from "http-errors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session"; 
import FileStoreFactory from "session-file-store";
import crypto from "node:crypto"; // For generating secure random values

import morgan from "morgan";
import logger, { morganStream } from "./utils/logger.js"; // winston logger

// Load environment variables (ensure this is done before using process.env)
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

//  Explicitly create __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json
const info = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")
);
logger.info(`[APP] info.name: ${info.name}, info.version: ${info.version}`);

const app = express();

app.disable("x-powered-by"); // security best practice

// Create the application object in locals for holding a connection pool

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");



if (process.env.NODE_ENV === "production") {
  app.use(
    morgan("combined", {
      stream: morganStream
    })
  );
} else {
  app.use(morgan("dev")); // color-coded, short, easy for dev
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

// Session configuration
// Only creating a FileStore instance if in development environment
const FileStore = FileStoreFactory(session);

// Generate a secure session secret if not provided
const generateSecureSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Configure session middleware with secure defaults
app.use(session({
  // Basic session configuration
  secret: process.env.SESSION_SECRET || generateSecureSecret(),
  name: 'sse.sid', // Custom name avoids revealing tech stack
  resave: false,   // Prevents unnecessary session saves
  saveUninitialized: false, // Helps with GDPR compliance
  
  // Storage configuration
  store: new FileStore({
    path: path.join(__dirname, '../sessions'), // Store sessions in a dedicated directory
    ttl: 86400,          // Session lifetime: 1 day (in seconds)
    reapInterval: 3600,  // Clean expired sessions hourly
    retries: 1,          // Retry once if reading sessions fails
    fileExtension: '.session'
  }),
  
  // Cookie settings
  cookie: { 
    httpOnly: true,      // Prevents client-side JavaScript access
    secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
    sameSite: 'lax',     // Provides CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  }
}));

// Add session debugging middleware in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    logger.debug(`Session ID: ${req.session.id}`);
    next();
  });
}

// Static paths
app.use(
  "/stylesheets/",
  express.static(path.join(__dirname, "../node_modules/bootstrap/dist/css"))
);
app.use(
  "/stylesheets",
  express.static(path.join(__dirname, "../node_modules/bootstrap-icons/font"))
);
app.use(
  "/img/svg",
  express.static(path.join(__dirname, "../node_modules/bootstrap-icons/icons"))
);

app.use(
  "/javascripts",
  express.static(path.join(__dirname, "../node_modules/bootstrap/dist/js"))
);



import router from "./routes/router.js";
app.use(router);



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

import { shutdownHooks } from './utils/shutdown_hooks.js';

// Track if shutdown has been called to prevent duplicate execution
let shutdownInProgress = false;

// Unified shutdown function
export async function shutdown() {
  // Prevent duplicate shutdown calls
  if (shutdownInProgress) {
    return;
  }
  shutdownInProgress = true;

  try {
    logger.info("Shutdown initiated...");

    // Run all shutdown hooks
    await shutdownHooks.runAll(logger);
    
    logger.info("Shutdown hooks completed, closing logger...");
    
    // Wait for all logs to be written by explicitly closing the logger
    await new Promise((resolve) => {
      logger.on('finish', resolve);
      logger.end();
    });
  } catch (error) {
    // Use console for error logging since logger may be closed
    console.error("Error occurred during shutdown:", error);
  }
}

export default app;
