const request = require("supertest");
const app = require("./app");
const Strava = require("./models/strava");
const Emoji = require("./models/emoji");
const axios = require("axios");

// FILE: app.test.js

"use strict";


jest.mock("./models/strava");
jest.mock("./models/emoji");
jest.mock("axios");

describe("App Routes", () => {
  describe("GET /emoji/random-emoji", () => {
    it("should return a random emoji", async () => {
      const mockEmoji = { emoji: "😊" };
      Emoji.getRandomEmoji.mockResolvedValue(mockEmoji);

      const response = await request(app).get("/emoji/random-emoji");
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ emoji: mockEmoji });
    });

    it("should handle errors", async () => {
      Emoji.getRandomEmoji.mockRejectedValue(new Error("No emoji found"));

      const response = await request(app).get("/emoji/random-emoji");
      expect(response.statusCode).toBe(500);
    });
  });

  describe("GET /auth/strava", () => {
    it("should handle errors during token exchange", async () => {
      axios.post.mockRejectedValue(new Error("Token exchange failed"));

      const response = await request(app).get("/auth/strava?code=test_code");
      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({ success: false, message: "Token exchange failed" });
    });
  });

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
        .send({ aspect_type: "update", object_id: 123, owner_id: 1, updates: {} });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("404 handler", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/non-existent-route");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({
        error: { message: "Not Found", status: 404 },
      });
    });
  });
});