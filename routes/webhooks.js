"use strict";

const express = require("express");
const axios = require("axios");
const Strava = require("../models/strava");
require("dotenv").config();

const router = new express.Router();

const STRAVA_API_URL = "https://www.strava.com/api/v3";

// Determine the emoji API URL based on the environment
const EMOJI_API_URL = process.env.NODE_ENV === 'production' ? process.env.PROD_EMOJI_API_URL : process.env.LOCAL_EMOJI_API_URL;

// Webhook endpoint for Strava
router.post("/webhook", async (req, res, next) => {
  //console.log("webhook event received!", req.query, req.body);
  const { aspect_type, object_id, owner_id } = req.body;

  if (aspect_type === "create") {
    //console.log(`New activity created: ${object_id} by user ${owner_id}`);
    const user = await Strava.getUser(owner_id);

    if (!user) {
      console.error(`User ${owner_id} not found`);
      return res.sendStatus(404);
    }

    await updateActivityTitle(object_id, user);
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
    throw new Error("Invalid access token");
  }
};

// Function to update activity title with a random emoji
const updateActivityTitle = async (activityId, user) => {
  await verifyAccessToken(user.access_token);
  const URL = `${STRAVA_API_URL}/activities/${activityId}`;
  console.log("URL", URL);
  try {
    const emojiResponse = await axios.get(EMOJI_API_URL);
    const randomEmoji = emojiResponse.data.emoji.emoji;
    

    await axios.request({
      method: "PUT",
      url: URL,
      data: { name: `${randomEmoji}` },
      headers: {
        "Authorization": `Bearer ${user.access_token}`,
        "Content-Type": "application/json",
      }
    });

    console.log(`Updated activity ${activityId} with emoji ${randomEmoji}`);
  } catch (error) {
    console.error(`Failed to update activity ${activityId}:`, error);
  }
};

module.exports = router;
