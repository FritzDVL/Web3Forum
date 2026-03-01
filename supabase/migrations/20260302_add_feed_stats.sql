-- ============================================
-- Add Feed Statistics Tracking
-- Created: 2026-03-02
-- Purpose: Track replies, views, and last post time for feeds
-- ============================================

-- Add new columns to feeds table
ALTER TABLE feeds
ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_post_at TIMESTAMP WITH TIME ZONE;

-- Create index for last_post_at for sorting
CREATE INDEX IF NOT EXISTS idx_feeds_last_post_at ON feeds(last_post_at DESC NULLS LAST);

-- Function: Update feed stats when a post is created
CREATE OR REPLACE FUNCTION update_feed_stats_on_post_create()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feeds
  SET 
    post_count = post_count + 1,
    last_post_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.feed_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update feed reply count when post reply count changes
CREATE OR REPLACE FUNCTION update_feed_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.replies_count != OLD.replies_count THEN
    UPDATE feeds
    SET 
      replies_count = replies_count + (NEW.replies_count - OLD.replies_count),
      updated_at = NOW()
    WHERE id = NEW.feed_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update feed view count when post view count changes
CREATE OR REPLACE FUNCTION update_feed_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.views_count != OLD.views_count THEN
    UPDATE feeds
    SET 
      views_count = views_count + (NEW.views_count - OLD.views_count),
      updated_at = NOW()
    WHERE id = NEW.feed_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update feed stats when post is created
DROP TRIGGER IF EXISTS trigger_update_feed_stats_on_post_create ON feed_posts;
CREATE TRIGGER trigger_update_feed_stats_on_post_create
  AFTER INSERT ON feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_stats_on_post_create();

-- Trigger: Update feed reply count when post replies change
DROP TRIGGER IF EXISTS trigger_update_feed_reply_count ON feed_posts;
CREATE TRIGGER trigger_update_feed_reply_count
  AFTER UPDATE OF replies_count ON feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_reply_count();

-- Trigger: Update feed view count when post views change
DROP TRIGGER IF EXISTS trigger_update_feed_view_count ON feed_posts;
CREATE TRIGGER trigger_update_feed_view_count
  AFTER UPDATE OF views_count ON feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_view_count();

-- Backfill existing data (calculate current stats)
UPDATE feeds f
SET 
  replies_count = COALESCE((
    SELECT SUM(replies_count)
    FROM feed_posts
    WHERE feed_id = f.id
  ), 0),
  views_count = COALESCE((
    SELECT SUM(views_count)
    FROM feed_posts
    WHERE feed_id = f.id
  ), 0),
  last_post_at = (
    SELECT MAX(created_at)
    FROM feed_posts
    WHERE feed_id = f.id
  );

-- ============================================
-- FEED STATS TRACKING COMPLETE
-- ============================================
