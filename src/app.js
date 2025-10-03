import fs from "fs";
import createError from "http-errors";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";

import morgan from "morgan";
import logger from "./utils/logger.js"; // winston logger

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

// Create the application object in locals for holding a connection pool

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const accessLogStream = fs.createWriteStream(path.join("logs", "access.log"), {
  flags: "a",
});

if (process.env.NODE_ENV === "production") {
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
} else {
  app.use(morgan("dev")); // color-coded, short, easy for dev
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

app.use(
  "/css/",
  express.static(path.join(__dirname, "../node_modules/bootstrap/dist/css"))
);
app.use(
  "/css",
  express.static(path.join(__dirname, "../node_modules/bootstrap-icons/font"))
);
app.use(
  "/img/svg",
  express.static(path.join(__dirname, "../node_modules/bootstrap-icons/icons"))
);

app.use(
  "/js",
  express.static(path.join(__dirname, "../node_modules/bootstrap/dist/js"))
);
app.use(
  "/js",
  express.static(path.join(__dirname, "../node_modules/axios/dist"))
);
/*
app.use(
  "/js",
  express.static(path.join(__dirname, "../node_modules/jquery/dist"))
);*/
app.use("/js", express.static(path.join(__dirname, "../node_modules/dayjs")));

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET || 'fallback-secret', // fallback for dev
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set to true if using HTTPS
  })
);

import router from "./routes/router.js";
app.use(router);

import sseRouter from './routes/sseRouter.js';
import * as sseSendTimeController from './controllers/sseSendTimeController.js';

app.use('/sse', sseRouter);

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

// Unified shutdown function
export function shutdown() {
  logger.info("Shutdown initiated...");
  //TODO: Rewire for building ability to add shutdown tasks without modifying app.js

  // Notify SSE clients
  if (typeof sseSendTimeController.broadcastShutdown === 'function') {
    logger.warn("Broadcasting shutdown to SSE clients...");
        sseSendTimeController.broadcastShutdown();
    }
    // Add other cleanup logic here if needed
}

export default app;
