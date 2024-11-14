"use strict";

const db = require("../db");
const {  NotFoundError } = require("../expressError");

/** Related functions for strava items. */
class Strava {
  /** Create a user in the database */
  static async createUser(athlete_id, access_token, refresh_token, token_expires_at) {
    const duplicateCheck = await db.query(
          `SELECT athlete_id
           FROM Users
           WHERE athlete_id = $1`,
        [athlete_id]);
      
        if (duplicateCheck.rows[0]) {
          return await Strava.updateUser(athlete_id, access_token, refresh_token, token_expires_at);
        }
    

    const result = await db.query(
          `INSERT INTO Users (athlete_id, access_token, refresh_token, token_expires_at)
           VALUES ($1, $2, $3, $4)
           RETURNING athlete_id, access_token, refresh_token, token_expires_at`,
        [athlete_id, access_token, refresh_token, token_expires_at]);
    const user = result.rows[0];

    return user;

  }
  /** Update user in the database */
  static async updateUser(athlete_id, access_token, refresh_token, token_expires_at) {
    const result = await db.query(
          `UPDATE Users
           SET access_token = $2, refresh_token = $3, token_expires_at = $4
           WHERE athlete_id = $1
           RETURNING athlete_id, access_token, refresh_token, token_expires_at`,
        [athlete_id, access_token, refresh_token, token_expires_at]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No such user: ${athlete_id}`);

    return user;
  }
  /** Get user from the database */
  static async getUser(athlete_id) {
    const userRes = await db.query(
          `SELECT athlete_id, access_token, refresh_token, token_expires_at
           FROM Users
           WHERE athlete_id = $1`,
        [athlete_id]);

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No such user: ${athlete_id}`);

    return user;
  }

  /** Delete user from the database */
  static async deleteUser(athlete_id) {
    const result = await db.query(
          `DELETE
           FROM Users
           WHERE athlete_id = $1
           RETURNING athlete_id`,
        [athlete_id]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No such user: ${athlete_id}`);
  }
}

module.exports = Strava;