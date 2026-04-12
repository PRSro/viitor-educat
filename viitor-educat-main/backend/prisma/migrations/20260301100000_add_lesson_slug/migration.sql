-- Add slug column to Lesson table
ALTER TABLE "Lesson" ADD COLUMN "slug" TEXT NOT NULL DEFAULT 'temp';

-- Create unique index (will fail if duplicates exist, which they won't after backfill)
-- The backfill script will handle generating unique slugs
