"use strict";

const express = require("express");
const axios = require("axios");
const Strava = require("../models/strava");
require("dotenv").config();

const router = new express.Router();

const STRAVA_API_URL = "https://www.strava.com/api/v3";

// Determine the emoji API URL based on the environment
const EMOJI_API_URL =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_EMOJI_API_URL
    : process.env.LOCAL_EMOJI_API_URL;

// Webhook endpoint for Strava
router.post("/webhook", async (req, res, next) => {
  console.log("webhook event received!", req.query, req.body);
  const { aspect_type, object_id, owner_id, updates } = req.body;

  if (aspect_type === "create") {
    //console.log(`New activity created: ${object_id} by user ${owner_id}`);
    const user = await Strava.getUser(owner_id);

    if (!user) {
      console.error(`User ${owner_id} not found`);
      return res.sendStatus(404);
    }

    await updateActivityTitle(object_id, user);
  } else if (updates.authorized === "false") {
    const user = await Strava.getUser(owner_id);

    if (!user) {
      console.error(`User ${owner_id} not found`);
      return res.sendStatus(404);
    }

    // Delete user from the database
    await Strava.deleteUser(owner_id);
    console.log("User deauthorized the app and is removed from db");
  } else {
    console.log("webhook event recieved!");
  }

  res.sendStatus(200); // Acknowledge receipt of the webhook
});

// Endpoint to verify Strava webhook subscription (required by Strava)
router.get("/webhook", (req, res, next) => {
  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = "SillyEmojiTitles";
  // Parses the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Verifies that the mode and token sent are valid
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.json({ "hub.challenge": challenge });
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Function to verify access token
const verifyAccessToken = async (accessToken, user) => {
  try {
    const response = await axios.get(`${STRAVA_API_URL}/athlete`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying access token:', error.response ? error.response.data : error.message);

    if (error.response && error.response.status === 401) {
      // Token is invalid, refresh the token
      try {
        const newAccessToken = await refreshAccessToken(user.refresh_token);
        user.access_token = newAccessToken;
        try {
          await Strava.updateUser(user.athlete_id, user.access_token, user.refresh_token, user.token_expires_at);
        } catch (error) {
          console.error('Error updating user:', error.message);
          throw new Error('Failed to update user');
        }
        
        // Retry verification with the new token
        const response = await axios.get(`${STRAVA_API_URL}/athlete`, {
          headers: {
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
        return response.data;
      } catch (refreshError) {
        console.error('Error refreshing access token:', refreshError.message);
        throw new Error('Invalid access token and failed to refresh');
      }
    } else {
      throw new Error('Invalid access token');
    }
  }
};

// Function to refresh access token
const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to refresh access token');
  }
};

// Function to update activity title with a random emoji
const updateActivityTitle = async (activityId, user) => {
  await verifyAccessToken(user.access_token, user);
  const URL = `${STRAVA_API_URL}/activities/${activityId}`;

  try {
    const emojiResponse = await axios.get(EMOJI_API_URL);
    const randomEmoji = emojiResponse.data.emoji.emoji;

    await axios.request({
      method: 'PUT',
      url: URL,
      headers: {
        Authorization: `Bearer ${user.access_token}`,
      },
      data: {
        name: `${randomEmoji}`,
      },
    });
  } catch (error) {
    console.error('Error updating activity title:', error.response ? error.response.data : error.message);
    throw new Error('Failed to update activity title');
  }
};

module.exports = router;
