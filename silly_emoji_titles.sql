\echo 'Delete and recreate silly_emoji_titles db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE silly_emoji_titles;
CREATE DATABASE silly_emoji_titles;
\connect silly_emoji_titles

\i silly_emoji_titles-schema.sql
\i silly_emoji_titles-seed.sql

\echo 'Delete and recreate silly_emoji_titles db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE silly_emoji_titles_test;
CREATE DATABASE silly_emoji_titles_test;
\connect silly_emoji_titles_test

\i silly_emoji_titles-schema.sql
\i silly_emoji_titles-seed.sql