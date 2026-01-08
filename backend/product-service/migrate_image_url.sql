-- Migration script to change image_url from VARCHAR(500) to TEXT
ALTER TABLE products ALTER COLUMN image_url TYPE TEXT;

