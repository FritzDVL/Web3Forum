-- ============================================
-- Add Parent Tracking to Feed Posts
-- Created: 2026-03-02
-- Purpose: Track reply relationships for better formatting
-- ============================================

-- Add parent_post_id column to track reply relationships
ALTER TABLE feed_posts
ADD COLUMN parent_post_id TEXT;

-- Add index for efficient reply fetching
CREATE INDEX idx_feed_posts_parent_post_id ON feed_posts(parent_post_id);

-- Add comment for documentation
COMMENT ON COLUMN feed_posts.parent_post_id IS 'Lens post ID of parent post. NULL for opening posts, NOT NULL for replies';

-- ============================================
-- PARENT TRACKING COMPLETE
-- ============================================
