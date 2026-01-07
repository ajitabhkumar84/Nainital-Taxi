-- Migration: Add gallery_images column to packages table
-- This column stores an array of gallery images with names
-- Format: [{"url": "...", "name": "..."}, ...]

-- Add the gallery_images column to packages table
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT NULL;

-- Add a comment to explain the column
COMMENT ON COLUMN packages.gallery_images IS 'Array of gallery images with names in format: [{"url": "...", "name": "..."}]';

-- Optional: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_packages_gallery_images ON packages USING GIN (gallery_images);

-- Note: The gallery_urls column remains for backward compatibility
-- New packages should use gallery_images instead of gallery_urls
