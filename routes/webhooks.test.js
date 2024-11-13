const request = require("supertest");
const express = require("express");
const axios = require("axios");
const Strava = require("../models/strava");
const webhooksRouter = require("./webhooks");

// FILE: routes/webhooks.test.js

"use strict";


jest.mock("axios");
jest.mock("../models/strava");

const app = express();
app.use(express.json());
app.use("/", webhooksRouter);

describe("POST /webhook", () => {

  it("should return 404 if user is not found", async () => {
    Strava.getUser.mockResolvedValue(null);

    const response = await request(app)
      .post("/webhook")
      .send({ aspect_type: "create", object_id: 123, owner_id: 1 });

    expect(response.statusCode).toBe(404);
    expect(Strava.getUser).toHaveBeenCalledWith(1);
  });

  it("should acknowledge non-create events", async () => {
    const response = await request(app)
      .post("/webhook")
      .send({ aspect_type: "update", object_id: 123, owner_id: 1 });

    expect(response.statusCode).toBe(200);
  });
});

describe("GET /webhook", () => {
  it("should verify webhook subscription", async () => {
    const response = await request(app)
      .get("/webhook")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": "SillyEmojiTitles",
        "hub.challenge": "challenge_token",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ "hub.challenge": "challenge_token" });
  });

  it("should return 403 for invalid verify token", async () => {
    const response = await request(app)
      .get("/webhook")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": "InvalidToken",
        "hub.challenge": "challenge_token",
      });

    expect(response.statusCode).toBe(403);
  });
});