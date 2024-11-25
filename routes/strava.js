"use strict";

const express = require("express");
const Strava = require("../models/strava");
const axios = require("axios");
require("dotenv").config();

const router = new express.Router();

// Strava API URLs
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

// Endpoint to handle Strava OAuth authorization
router.get("/strava", async (req, res, next) => {
  const { code } = req.query;

  if (!code) {
    console.error("Missing authorization code");
    return res.redirect(
      `${process.env.REACT_APP_FRONTEND_URL}/view?error=missing_code`
    );
  }

  try {
    const requestData = {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    };

    const response = await axios.post(STRAVA_TOKEN_URL, requestData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { access_token, refresh_token, expires_at, athlete } = response.data;

    const user = await Strava.createUser(
      athlete.id,
      access_token,
      refresh_token,
      expires_at
    );

    //console.log('User created/updated:', user);

    res.redirect(`${process.env.REACT_APP_FRONTEND_URL}/view?code=${code}`);
  } catch (error) {
    console.error(
      "Error during token exchange:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint to refresh Strava token
router.post("/refresh-token", async (req, res, next) => {
  const { userId } = req.body;

  try {
    const user = await Strava.getUser(userId);
    if (!user)
      throw new Error(
        "User not found, no Token to refresh, please authenticate with Strava."
      );

    const { refresh_token } = user.refresh_token;
    const response = await axios.post(process.env.STRAVA_TOKEN_URL, {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token,
    });

    const {
      access_token,
      refresh_token: new_refresh_token,
      expires_at,
    } = response.data;
    await Strava.updateUser(
      userId,
      access_token,
      new_refresh_token,
      expires_at
    );

    //console.log('Token refreshed:', updatedUser);

    res.json({ success: true, access_token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to verify access token
router.post("/verify-token", async (req, res) => {
  const { accessToken, userId } = req.body;

  try {
    const athlete = await verifyAccessToken(accessToken);
    res.status(200).json({ success: true, athlete });
  } catch (error) {
    console.log(
      "Access token verification failed, attempting to refresh token..."
    );
    try {
      const user = await Strava.getUser(userId);
      if (!user) {
        throw new Error("User not found, cannot refresh token.");
      }

      const { refresh_token } = user;
      const requestData = {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      };

      const response = await axios.post(
        process.env.STRAVA_TOKEN_URL,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const {
        access_token,
        refresh_token: new_refresh_token,
        expires_at,
      } = response.data;

      await Strava.updateUser(userId, {
        access_token,
        refresh_token: new_refresh_token,
        expires_at,
      });

      const athlete = await verifyAccessToken(access_token);
      res.status(200).json({
        success: true,
        athlete,
        newAccessToken: access_token,
        newRefreshToken: new_refresh_token,
        expiresAt: expires_at,
      });
    } catch (refreshError) {
      res.status(400).json({ success: false, message: refreshError.message });
    }
  }
});

// Function to verify access token
const verifyAccessToken = async (accessToken) => {
  try {
    const response = await axios.get(`${STRAVA_API_URL}/athlete`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error verifying access token:",
      error.response ? error.response.data : error.message
    );
  }
};

module.exports = router;
