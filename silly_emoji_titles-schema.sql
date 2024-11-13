-- Drop tables if they already exist
DROP TABLE IF EXISTS Users, Emoji CASCADE;

-- Create Users table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    athlete_id VARCHAR(50) UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at VARCHAR(512) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Emojis table
CREATE TABLE Emojis (
    Emoji	VARCHAR(512),
    Description	VARCHAR(512)
);
