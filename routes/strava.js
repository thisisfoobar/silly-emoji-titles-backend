"use strict";

const express = require("express");
const Strava = require("../models/strava");
const axios = require("axios");
require('dotenv').config();

const router = new express.Router();

// Strava API URLs
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

// Endpoint to handle Strava OAuth authorization
router.get('/strava', async (req, res, next) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

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
    
    const user = await Strava.createUser(athlete.id, access_token, refresh_token, expires_at);
    
    //console.log('User created/updated:', user);
    res.json({ success: true, access_token });

    res.redirect(`${process.env.REACT_APP_FRONTEND_URL}/view?code=${code}`);
  } catch (error) {
    console.error('Error during token exchange:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint to refresh Strava token
router.post('/refresh-token', async (req, res, next) => {
  const { userId } = req.body;

  
  try {
    const user = await Strava.getUser(userId);
    if (!user) throw new Error('User not found, no Token to refresh, please authenticate with Strava.');

    const { refresh_token } = user.refresh_token;
    const response = await axios.post(process.env.STRAVA_TOKEN_URL, {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token,
    });

    const { access_token, refresh_token: new_refresh_token, expires_at } = response.data;
    await Strava.updateUser(userId, access_token, new_refresh_token, expires_at);

    //console.log('Token refreshed:', updatedUser);

    res.json({ success: true, access_token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;