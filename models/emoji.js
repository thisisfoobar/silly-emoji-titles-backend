"use strict";

const db = require("../db");

// Related functions for emojis and retrieving random emojis
class Emoji {
  static async getRandomEmoji() {
    const result = await db.query(
      `SELECT emoji
       FROM emojis
       ORDER BY RANDOM()
       LIMIT 1`
    );
    const emoji = result.rows[0];
    if (!emoji) throw new Error("No emoji found");
    return emoji;
  }
}

module.exports = Emoji;