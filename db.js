"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

/** uncomment out for local development */
//const password = require("./secretpassword")

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    connectionString: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // development locally
  db = new Client({
    user: "thisisfoobar",
    host: "localhost",
    database: getDatabaseUri(),
    password: 'thisisfoobar1',
    port: 5432,
  });
}

db.connect();

module.exports = db;