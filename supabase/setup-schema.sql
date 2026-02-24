-- ============================================
-- Web3Forum Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. COMMUNITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lens_group_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  feed TEXT,
  members_count INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_communities_featured CHECK (featured IN (0, 1))
);

-- Indexes for communities
CREATE INDEX IF NOT EXISTS idx_communities_lens_group_address ON communities(lens_group_address);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communities_featured ON communities(featured) WHERE featured = 1;
CREATE INDEX IF NOT EXISTS idx_communities_feed ON communities(feed);

-- Enable Row Level Security
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities
DROP POLICY IF EXISTS "Allow public read access" ON communities;
CREATE POLICY "Allow public read access" ON communities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON communities;
CREATE POLICY "Allow authenticated insert" ON communities
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON communities;
CREATE POLICY "Allow authenticated update" ON communities
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON communities;
CREATE POLICY "Allow authenticated delete" ON communities
  FOR DELETE USING (true);

-- ============================================
-- 2. COMMUNITY_THREADS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS community_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  lens_feed_address TEXT NOT NULL,
  author TEXT NOT NULL,
  root_post_id TEXT,
  slug TEXT,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  replies_count INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for community_threads
CREATE INDEX IF NOT EXISTS idx_community_threads_community_id ON community_threads(community_id);
CREATE INDEX IF NOT EXISTS idx_community_threads_lens_feed_address ON community_threads(lens_feed_address);
CREATE INDEX IF NOT EXISTS idx_community_threads_created_at ON community_threads(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_threads_slug ON community_threads(slug);

-- Enable Row Level Security
ALTER TABLE community_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_threads
DROP POLICY IF EXISTS "Allow public read access" ON community_threads;
CREATE POLICY "Allow public read access" ON community_threads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON community_threads;
CREATE POLICY "Allow authenticated insert" ON community_threads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON community_threads;
CREATE POLICY "Allow authenticated update" ON community_threads
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON community_threads;
CREATE POLICY "Allow authenticated delete" ON community_threads
  FOR DELETE USING (true);

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Function: Get community thread count
CREATE OR REPLACE FUNCTION get_community_thread_count(community_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM community_threads
    WHERE community_id = community_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Increment replies count
CREATE OR REPLACE FUNCTION increment_replies_count(thread_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_threads
  SET replies_count = replies_count + 1
  WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Increment community members count
CREATE OR REPLACE FUNCTION increment_community_members_count(comm_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE communities 
  SET members_count = members_count + 1 
  WHERE id = comm_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Decrement community members count
CREATE OR REPLACE FUNCTION decrement_community_members_count(comm_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE communities 
  SET members_count = GREATEST(members_count - 1, 0) 
  WHERE id = comm_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- You can now run your Web3Forum application
-- ============================================
