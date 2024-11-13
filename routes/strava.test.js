const request = require("supertest");
const express = require("express");
const axios = require("axios");
const Strava = require("../models/strava");
const stravaRouter = require("./strava");

// FILE: routes/stravass.test.js

"use strict";


jest.mock("axios");
jest.mock("../models/strava");

const app = express();
app.use(express.json());
app.use("/", stravaRouter);

beforeAll(() => {
  process.env.REACT_APP_FRONTEND_URL = "http://localhost:3000";
});

describe("GET /strava", () => {
  it("should return 400 if no authorization code is provided", async () => {
    const response = await request(app).get("/strava");
    expect(response.statusCode).toBe(400);
    expect(response.text).toBe("Missing authorization code");
  });

  it("should handle successful token exchange and user creation", async () => {
    const mockResponse = {
      data: {
        access_token: "access_token",
        refresh_token: "refresh_token",
        expires_at: 1234567890,
        athlete: { id: 1 },
      },
    };
    axios.post.mockResolvedValue(mockResponse);
    Strava.createUser.mockResolvedValue({ athlete_id: 1 });

    const response = await request(app).get("/strava?code=test_code");
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain(process.env.REACT_APP_FRONTEND_URL);
  });

  it("should handle errors during token exchange", async () => {
    axios.post.mockRejectedValue(new Error("Token exchange failed"));

    const response = await request(app).get("/strava?code=test_code");
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ success: false, message: "Token exchange failed" });
  });
});

describe("POST /refresh-token", () => {
  it("should refresh token successfully", async () => {
    const mockUser = { athlete_id: 1, refresh_token: "old_refresh_token" };
    const mockResponse = {
      data: {
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
        expires_at: 1234567890,
      },
    };
    Strava.getUser.mockResolvedValue(mockUser);
    axios.post.mockResolvedValue(mockResponse);
    Strava.updateUser.mockResolvedValue(mockUser);

    const response = await request(app).post("/refresh-token").send({ userId: 1 });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ success: true, access_token: "new_access_token" });
  });

  it("should handle user not found error", async () => {
    Strava.getUser.mockResolvedValue(null);

    const response = await request(app).post("/refresh-token").send({ userId: 1 });
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ success: false, message: "User not found, no Token to refresh, please authenticate with Strava." });
  });

  it("should handle errors during token refresh", async () => {
    const mockUser = { athlete_id: 1, refresh_token: "old_refresh_token" };
    Strava.getUser.mockResolvedValue(mockUser);
    axios.post.mockRejectedValue(new Error("Token refresh failed"));

    const response = await request(app).post("/refresh-token").send({ userId: 1 });
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ success: false, message: "Token refresh failed" });
  });
});