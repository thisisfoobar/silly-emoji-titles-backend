\echo 'Delete and recreate strava_emoji_titles db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE strava_emoji_titles;
CREATE DATABASE strava_emoji_titles;
\connect strava_emoji_titles

\i strava_emoji_titles-schema.sql
\i strava_emoji_titles-seed.sql

\echo 'Delete and recreate strava_emoji_titles db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE strava_emoji_titles_test;
CREATE DATABASE strava_emoji_titles_test;
\connect strava_emoji_titles_test

\i strava_emoji_titles-schema.sql
\i strava_emoji_titles-seed.sql