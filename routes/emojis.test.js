const request = require("supertest");
const express = require("express");
const Emoji = require("../models/emoji");
const emojisRouter = require("./emojis");

// FILE: routes/emojis.test.js

"use strict";


jest.mock("../models/emoji");

const app = express();
app.use(express.json());
app.use("/emojis", emojisRouter);

describe("GET /emojis/random-emoji", () => {
  it("should return a random emoji", async () => {
    const mockEmoji = { emoji: "😊" };
    Emoji.getRandomEmoji.mockResolvedValue(mockEmoji);

    const response = await request(app).get("/emojis/random-emoji");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ emoji: mockEmoji });
  });

  it("should handle errors", async () => {
    Emoji.getRandomEmoji.mockRejectedValue(new Error("No emoji found"));

    const response = await request(app).get("/emojis/random-emoji");
    expect(response.statusCode).toBe(500);
  });
});