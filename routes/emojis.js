"use strict";

const db = require("../db");
const express = require("express");
const Emoji = require("../models/emoji");

const router = new express.Router();

// Endpoint to get a random emoji
router.get('/random-emoji', async function(req, res, next) {
  try {
    
    const emoji = await Emoji.getRandomEmoji();

    return res.json({ emoji });
  } catch (err) {
    return next(err)
  }
});

module.exports = router;