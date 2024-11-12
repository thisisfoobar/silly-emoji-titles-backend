"use strict";

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express().use(bodyParser.json());
app.use(cors());
app.use(express.json());

// Strava API URLs
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_URL = 'https://www.strava.com/api/v3/activities';

// In-memory store for tokens (replace with a database in production)
let userTokens = {}; // { userId: { accessToken, refreshToken, expiresAt } }

// TESTING
app.get('/', (req, res) => {
  return res.send('Hello World');
});

// Endpoint to handle Strava OAuth authorization
app.get('/auth/strava', async (req, res) => {
  const { code } = req.query;

  try {
    const requestData = {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    };

    const response = await axios.post(STRAVA_TOKEN_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { access_token, refresh_token, expires_at, athlete } = response.data;
    userTokens[athlete.id] = { access_token, refresh_token, expires_at };

    res.json({ success: true, access_token });
  } catch (error) {
    console.error('Error during token exchange:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint to refresh Strava token
app.post('/refresh-token', async (req, res) => {
  const { userId } = req.body;
  try {
    if (!userTokens[userId]) throw new Error('User not authenticated.');

    const { refresh_token } = userTokens[userId];
    const response = await axios.post(STRAVA_TOKEN_URL, {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token,
    });

    const { access_token, refresh_token: new_refresh_token, expires_at } = response.data;
    userTokens[userId] = { access_token, refresh_token: new_refresh_token, expires_at };

    res.json({ success: true, access_token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint to get a random emoji
app.get('/random-emoji', (req, res) => {
  const emojis = ['😀', '🚴‍♂️', '🏃‍♀️', '🏊‍♂️', '🚶‍♂️', '⛷️', '🏋️‍♀️'];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  res.json({ emoji: randomEmoji });
});

// Webhook endpoint for Strava
app.post('/webhook', async (req, res) => {
  const { aspect_type, object_id, owner_id } = req.body;

  if (aspect_type === 'create') {
    console.log(`New activity created: ${object_id} by user ${owner_id}`);
    await updateActivityTitle(object_id, owner_id);
  } else {
    console.log("webhook event recieved!", req.query, req.body)
  }

  res.sendStatus(200); // Acknowledge receipt of the webhook
});

// Endpoint to verify Strava webhook subscription (required by Strava)
app.get('/webhook', (req, res) => {
    // Your verify token. Should be a random string.
    const VERIFY_TOKEN = "SillyEmojiTitles";
    // Parses the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
      // Verifies that the mode and token sent are valid
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {     
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.json({"hub.challenge":challenge});  
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
});

// Function to update activity title with a random emoji
const updateActivityTitle = async (activityId, userId) => {
  try {
    if (!userTokens[userId]) throw new Error('User not authenticated.');

    const { access_token } = userTokens[userId];
    const emojiResponse = await axios.get('http://localhost:5000/random-emoji');
    const randomEmoji = emojiResponse.data.emoji;

    await axios.put(
      `${STRAVA_API_URL}/${activityId}`,
      { name: `Workout ${randomEmoji}` },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    console.log(`Updated activity ${activityId} with emoji ${randomEmoji}`);
  } catch (error) {
    console.error(`Failed to update activity ${activityId}:`, error.message);
  }
};

// Start the server on port 5000
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});


// curl -X POST https://www.strava.com/api/v3/push_subscriptions \
//   -F client_id=139507 \
//   -F client_secret=e96ebede9d92d0d3ab94536e46d091e0d387d0b7 \
//   -F callback_url=https://4367-75-130-112-77.ngrok-free.app/webhook \
//   -F verify_token=SillyEmojiTitles

// curl -X GET 'https://4367-75-130-112-77.ngrok-free.app/webhook?hub.verify_token=SillyEmojiTitles&hub.challenge=test'

// curl -X GET "https://www.strava.com/api/v3/push_subscriptions?client_id=139507&client_secret=e96ebede9d92d0d3ab94536e46d091e0d387d0b7"