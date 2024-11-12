-- Drop tables if they already exist
DROP TABLE IF EXISTS Logs, Activity_Updates, Activities, Users, Emoji CASCADE;

-- Create Users table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    strava_id VARCHAR(50) UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Activities table
CREATE TABLE Activities (
    activity_id SERIAL PRIMARY KEY,
    strava_activity_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    title VARCHAR(255),
    date TIMESTAMP NOT NULL,
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending update',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Activity_Updates table
CREATE TABLE Activity_Updates (
    update_id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES Activities(activity_id) ON DELETE CASCADE,
    previous_title VARCHAR(255),
    new_title VARCHAR(255) NOT NULL,
    update_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'success',
    error_message TEXT
);

-- Create Logs table (Optional)
CREATE TABLE Logs (
    log_id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES Activities(activity_id) ON DELETE SET NULL,
    event TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Emojis table
CREATE TABLE Emojis (
    Emoji	VARCHAR(512),
    Description	VARCHAR(512)
);
