"use strict";

/** Express app for SillyEmojiTitles. */

const express = require("express");
const cors = require("cors");

const { NotFoundError } = require("./expressError");

const emojiRoute = require("./routes/emojis");
const stravaRoutes = require("./routes/strava");
const webhookRoutes = require("./routes/webhooks");

const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

app.use("/", webhookRoutes);
app.use("/auth", stravaRoutes);
app.use("/emoji", emojiRoute);


/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
