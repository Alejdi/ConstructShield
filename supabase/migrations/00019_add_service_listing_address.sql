-- Add address and location fields to service_listings
ALTER TABLE service_listings
  ADD COLUMN address TEXT,
  ADD COLUMN latitude FLOAT,
  ADD COLUMN longitude FLOAT;
