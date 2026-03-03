-- ============================================
-- Feeds System Database Schema
-- Created: 2026-02-27
-- Purpose: Support Society Protocol Commons Feeds
-- ============================================

-- ============================================
-- 1. FEEDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lens_feed_address TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- "general", "partners", "functions", "technical", "others"
  display_order INTEGER NOT NULL DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for feeds
CREATE INDEX IF NOT EXISTS idx_feeds_lens_feed_address ON feeds(lens_feed_address);
CREATE INDEX IF NOT EXISTS idx_feeds_category ON feeds(category);
CREATE INDEX IF NOT EXISTS idx_feeds_display_order ON feeds(display_order);
CREATE INDEX IF NOT EXISTS idx_feeds_featured ON feeds(featured) WHERE featured = true;

-- Enable Row Level Security
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feeds
DROP POLICY IF EXISTS "Allow public read access" ON feeds;
CREATE POLICY "Allow public read access" ON feeds
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON feeds;
CREATE POLICY "Allow authenticated insert" ON feeds
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON feeds;
CREATE POLICY "Allow authenticated update" ON feeds
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON feeds;
CREATE POLICY "Allow authenticated delete" ON feeds
  FOR DELETE USING (true);

-- ============================================
-- 2. FEED_POSTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id UUID NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  lens_post_id TEXT UNIQUE NOT NULL,
  author TEXT NOT NULL,
  title TEXT,
  content TEXT,
  replies_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for feed_posts
CREATE INDEX IF NOT EXISTS idx_feed_posts_feed_id ON feed_posts(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_lens_post_id ON feed_posts(lens_post_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON feed_posts(author);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON feed_posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feed_posts
DROP POLICY IF EXISTS "Allow public read access" ON feed_posts;
CREATE POLICY "Allow public read access" ON feed_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON feed_posts;
CREATE POLICY "Allow authenticated insert" ON feed_posts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON feed_posts;
CREATE POLICY "Allow authenticated update" ON feed_posts
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON feed_posts;
CREATE POLICY "Allow authenticated delete" ON feed_posts
  FOR DELETE USING (true);

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Function: Increment feed post count
CREATE OR REPLACE FUNCTION increment_feed_post_count(feed_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE feeds
  SET post_count = post_count + 1
  WHERE id = feed_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment feed post replies count
CREATE OR REPLACE FUNCTION increment_feed_post_replies_count(post_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE feed_posts
  SET replies_count = replies_count + 1
  WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function: Get feed post count
CREATE OR REPLACE FUNCTION get_feed_post_count(feed_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM feed_posts
    WHERE feed_id = feed_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FEEDS SCHEMA COMPLETE
-- ============================================
