-- ============================================
-- Web3Forum — Fresh Schema (No commentOn Architecture)
-- Run this on a clean Supabase instance.
-- ============================================

-- ============================================
-- 1. FORUM_BOARDS
-- Child-boards for Commons area. Each row is a UI category,
-- NOT a separate Lens Feed. All posts go to one Commons Feed.
-- ============================================

CREATE TABLE forum_boards (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  section TEXT NOT NULL,                     -- general, partners, functions, technical, others
  feed_type TEXT NOT NULL DEFAULT 'commons', -- commons | research | language-xx
  display_order INTEGER NOT NULL DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  thread_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  color TEXT,                                -- hex color for grid cards
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_boards_section ON forum_boards(section);
CREATE INDEX idx_forum_boards_feed_type ON forum_boards(feed_type);
CREATE INDEX idx_forum_boards_display_order ON forum_boards(display_order);

ALTER TABLE forum_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_boards_read" ON forum_boards FOR SELECT USING (true);
CREATE POLICY "forum_boards_insert" ON forum_boards FOR INSERT WITH CHECK (true);
CREATE POLICY "forum_boards_update" ON forum_boards FOR UPDATE USING (true);
CREATE POLICY "forum_boards_delete" ON forum_boards FOR DELETE USING (true);

-- ============================================
-- 2. FORUM_THREADS
-- Every thread root is a standalone Lens article.
-- Content cached in Supabase for instant reads.
-- ============================================

CREATE TABLE forum_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lens_post_id TEXT UNIQUE,                  -- NULL until Lens confirms
  content_uri TEXT,                          -- Grove URI
  board_slug TEXT REFERENCES forum_boards(slug),
  feed_type TEXT NOT NULL DEFAULT 'commons',
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  content_markdown TEXT,                     -- raw markdown for rendering
  content_json JSONB,                        -- editor JSON for re-hydration
  author_address TEXT NOT NULL,
  author_username TEXT,
  reply_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  publish_status TEXT DEFAULT 'pending'      -- pending | confirmed | failed
    CHECK (publish_status IN ('pending','confirmed','failed')),
  tags TEXT[],
  slug TEXT UNIQUE,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_threads_board ON forum_threads(board_slug);
CREATE INDEX idx_forum_threads_feed_type ON forum_threads(feed_type);
CREATE INDEX idx_forum_threads_lens_post ON forum_threads(lens_post_id);
CREATE INDEX idx_forum_threads_slug ON forum_threads(slug);
CREATE INDEX idx_forum_threads_author ON forum_threads(author_address);
CREATE INDEX idx_forum_threads_created ON forum_threads(created_at DESC);
CREATE INDEX idx_forum_threads_activity ON forum_threads(last_reply_at DESC NULLS LAST);
CREATE INDEX idx_forum_threads_pinned ON forum_threads(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_forum_threads_status ON forum_threads(publish_status);

ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_threads_read" ON forum_threads FOR SELECT USING (true);
CREATE POLICY "forum_threads_insert" ON forum_threads FOR INSERT WITH CHECK (true);
CREATE POLICY "forum_threads_update" ON forum_threads FOR UPDATE USING (true);
CREATE POLICY "forum_threads_delete" ON forum_threads FOR DELETE USING (true);

-- ============================================
-- 3. FORUM_REPLIES
-- Every reply is a standalone Lens article.
-- Thread relationship tracked by thread_id + position.
-- ============================================

CREATE TABLE forum_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  lens_post_id TEXT UNIQUE,
  content_uri TEXT,
  position INTEGER NOT NULL,                 -- reply #1, #2, #3...
  content_markdown TEXT,
  content_json JSONB,
  author_address TEXT NOT NULL,
  author_username TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  publish_status TEXT DEFAULT 'pending'
    CHECK (publish_status IN ('pending','confirmed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_replies_thread ON forum_replies(thread_id);
CREATE INDEX idx_forum_replies_position ON forum_replies(thread_id, position);
CREATE INDEX idx_forum_replies_lens_post ON forum_replies(lens_post_id);
CREATE INDEX idx_forum_replies_author ON forum_replies(author_address);
CREATE INDEX idx_forum_replies_created ON forum_replies(created_at DESC);

ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_replies_read" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "forum_replies_insert" ON forum_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "forum_replies_update" ON forum_replies FOR UPDATE USING (true);
CREATE POLICY "forum_replies_delete" ON forum_replies FOR DELETE USING (true);

-- ============================================
-- 4. RESEARCH_CATEGORIES
-- Fixed categories for the Research section.
-- ============================================

CREATE TABLE research_categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  publication_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  color TEXT
);

ALTER TABLE research_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "research_categories_read" ON research_categories FOR SELECT USING (true);
CREATE POLICY "research_categories_insert" ON research_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "research_categories_update" ON research_categories FOR UPDATE USING (true);

-- ============================================
-- 5. RESEARCH_PUBLICATIONS
-- Both root topics and responses. Every one is a standalone article.
-- ============================================

CREATE TABLE research_publications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lens_post_id TEXT UNIQUE,
  root_lens_post_id TEXT,                    -- NULL for root topics
  category_slug TEXT REFERENCES research_categories(slug),
  author_address TEXT NOT NULL,
  author_username TEXT,
  title TEXT,                                -- NULL for responses
  tags TEXT[],
  post_number INTEGER NOT NULL DEFAULT 1,
  is_root BOOLEAN NOT NULL DEFAULT TRUE,
  content_markdown TEXT,
  content_json JSONB,
  content_uri TEXT,
  views_count INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 1,             -- only meaningful on root rows
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  publish_status TEXT DEFAULT 'pending'
    CHECK (publish_status IN ('pending','confirmed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_research_pub_lens ON research_publications(lens_post_id);
CREATE INDEX idx_research_pub_root ON research_publications(root_lens_post_id);
CREATE INDEX idx_research_pub_category ON research_publications(category_slug);
CREATE INDEX idx_research_pub_is_root ON research_publications(is_root) WHERE is_root = true;
CREATE INDEX idx_research_pub_activity ON research_publications(last_activity_at DESC);
CREATE INDEX idx_research_pub_tags ON research_publications USING GIN(tags);

ALTER TABLE research_publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "research_pub_read" ON research_publications FOR SELECT USING (true);
CREATE POLICY "research_pub_insert" ON research_publications FOR INSERT WITH CHECK (true);
CREATE POLICY "research_pub_update" ON research_publications FOR UPDATE USING (true);
CREATE POLICY "research_pub_delete" ON research_publications FOR DELETE USING (true);

-- ============================================
-- 6. COMMUNITIES (Language Groups / Local)
-- Kept from original schema. Each community = 1 Lens Group + 1 Feed.
-- ============================================

CREATE TABLE communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lens_group_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  feed TEXT,                                 -- Lens Feed address
  members_count INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0
    CHECK (featured IN (0, 1)),
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communities_group ON communities(lens_group_address);
CREATE INDEX idx_communities_created ON communities(created_at DESC);
CREATE INDEX idx_communities_featured ON communities(featured) WHERE featured = 1;

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communities_read" ON communities FOR SELECT USING (true);
CREATE POLICY "communities_insert" ON communities FOR INSERT WITH CHECK (true);
CREATE POLICY "communities_update" ON communities FOR UPDATE USING (true);
CREATE POLICY "communities_delete" ON communities FOR DELETE USING (true);

-- ============================================
-- 7. COMMUNITY_THREADS
-- Threads inside language groups / local communities.
-- Same no-commentOn pattern: standalone articles.
-- ============================================

CREATE TABLE community_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  lens_post_id TEXT UNIQUE,
  content_uri TEXT,
  lens_feed_address TEXT NOT NULL,
  author TEXT NOT NULL,
  author_username TEXT,
  root_post_id TEXT,                         -- legacy compat, same as lens_post_id
  slug TEXT UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  content_markdown TEXT,
  content_json JSONB,
  replies_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  publish_status TEXT DEFAULT 'pending'
    CHECK (publish_status IN ('pending','confirmed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comm_threads_community ON community_threads(community_id);
CREATE INDEX idx_comm_threads_slug ON community_threads(slug);
CREATE INDEX idx_comm_threads_lens_post ON community_threads(lens_post_id);
CREATE INDEX idx_comm_threads_created ON community_threads(created_at DESC);

ALTER TABLE community_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_threads_read" ON community_threads FOR SELECT USING (true);
CREATE POLICY "comm_threads_insert" ON community_threads FOR INSERT WITH CHECK (true);
CREATE POLICY "comm_threads_update" ON community_threads FOR UPDATE USING (true);
CREATE POLICY "comm_threads_delete" ON community_threads FOR DELETE USING (true);

-- ============================================
-- 8. COMMUNITY_REPLIES
-- Replies inside language group threads. Standalone articles.
-- ============================================

CREATE TABLE community_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES community_threads(id) ON DELETE CASCADE,
  lens_post_id TEXT UNIQUE,
  content_uri TEXT,
  position INTEGER NOT NULL,
  content_markdown TEXT,
  content_json JSONB,
  author_address TEXT NOT NULL,
  author_username TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  publish_status TEXT DEFAULT 'pending'
    CHECK (publish_status IN ('pending','confirmed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comm_replies_thread ON community_replies(thread_id);
CREATE INDEX idx_comm_replies_position ON community_replies(thread_id, position);
CREATE INDEX idx_comm_replies_lens_post ON community_replies(lens_post_id);

ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_replies_read" ON community_replies FOR SELECT USING (true);
CREATE POLICY "comm_replies_insert" ON community_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "comm_replies_update" ON community_replies FOR UPDATE USING (true);
CREATE POLICY "comm_replies_delete" ON community_replies FOR DELETE USING (true);

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Increment thread count on a board
CREATE OR REPLACE FUNCTION increment_board_thread_count(board TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_boards SET thread_count = thread_count + 1, last_activity_at = NOW(), updated_at = NOW()
  WHERE slug = board;
END;
$$ LANGUAGE plpgsql;

-- Increment reply count on a forum thread + update board stats
CREATE OR REPLACE FUNCTION increment_forum_reply_count(t_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_threads SET reply_count = reply_count + 1, last_reply_at = NOW(), updated_at = NOW()
  WHERE id = t_id;
  UPDATE forum_boards SET reply_count = reply_count + 1, last_activity_at = NOW()
  WHERE slug = (SELECT board_slug FROM forum_threads WHERE id = t_id);
END;
$$ LANGUAGE plpgsql;

-- Increment views on a forum thread + board
CREATE OR REPLACE FUNCTION increment_forum_views(t_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_threads SET views_count = views_count + 1 WHERE id = t_id;
  UPDATE forum_boards SET views_count = views_count + 1
  WHERE slug = (SELECT board_slug FROM forum_threads WHERE id = t_id);
END;
$$ LANGUAGE plpgsql;

-- Get next reply position for a forum thread
CREATE OR REPLACE FUNCTION next_forum_reply_position(t_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((SELECT MAX(position) FROM forum_replies WHERE thread_id = t_id), 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- Increment community members count
CREATE OR REPLACE FUNCTION increment_community_members_count(comm_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE communities SET members_count = members_count + 1 WHERE id = comm_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement community members count
CREATE OR REPLACE FUNCTION decrement_community_members_count(comm_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE communities SET members_count = GREATEST(members_count - 1, 0) WHERE id = comm_id;
END;
$$ LANGUAGE plpgsql;

-- Increment community thread replies count
CREATE OR REPLACE FUNCTION increment_replies_count(thread_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_threads SET replies_count = replies_count + 1 WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql;

-- Get community thread count
CREATE OR REPLACE FUNCTION get_community_thread_count(community_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM community_threads WHERE community_id = community_uuid);
END;
$$ LANGUAGE plpgsql;

-- Increment research category publication count
CREATE OR REPLACE FUNCTION increment_research_category_count(cat_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE research_categories SET publication_count = publication_count + 1 WHERE slug = cat_slug;
END;
$$ LANGUAGE plpgsql;

-- Increment research root post count + activity
CREATE OR REPLACE FUNCTION increment_research_root_count(root_post_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE research_publications
  SET total_posts = total_posts + 1, last_activity_at = NOW()
  WHERE lens_post_id = root_post_id AND is_root = true;
END;
$$ LANGUAGE plpgsql;

-- Get next research post number
CREATE OR REPLACE FUNCTION next_research_post_number(root_post_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT MAX(post_number) FROM research_publications
    WHERE lens_post_id = root_post_id OR root_lens_post_id = root_post_id
  ), 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- Increment research views
CREATE OR REPLACE FUNCTION increment_research_views(post_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE research_publications SET views_count = views_count + 1
  WHERE lens_post_id = post_id AND is_root = true;
END;
$$ LANGUAGE plpgsql;

-- Full-text search across forum threads
CREATE OR REPLACE FUNCTION forum_search_threads(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS SETOF forum_threads AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM forum_threads
  WHERE is_hidden = false
    AND (
      title ILIKE '%' || search_query || '%'
      OR content_markdown ILIKE '%' || search_query || '%'
      OR author_username ILIKE '%' || search_query || '%'
    )
  ORDER BY created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. SEED DATA — Forum Boards (28 child-boards)
-- ============================================

INSERT INTO forum_boards (slug, name, description, section, feed_type, display_order, is_locked) VALUES
-- GENERAL DISCUSSION (4)
('beginners-help', 'Beginners & Help', 'New to the forum? Start here with questions and introductions.', 'general', 'commons', 1, false),
('key-concepts', '4 Key Concepts (Energy, Timeline, State, Actors, Accounts, Lifeline, Death, etc...)', 'Core concepts and fundamental principles of the system.', 'general', 'commons', 2, false),
('web3-outpost', 'Web3 Outpost (Outpod, Badges, Spec)', 'Web3 integration, badges, and technical specifications.', 'general', 'commons', 3, false),
('dao-governance', 'DAO Governance', 'Decentralized governance discussions and proposals.', 'general', 'commons', 4, false),

-- PARTNER COMMUNITIES (4)
('partner-general', 'General Discussion', 'Discussion about Society Protocol partner communities.', 'partners', 'commons', 5, false),
('partner-announcements', 'Announcements', 'Official partner news and updates.', 'partners', 'commons', 6, false),
('network-states', 'Network States Communities', 'Discussion about current and upcoming network states.', 'partners', 'commons', 7, false),
('partner-badges', 'Partner Badges & SPEC', 'Technical specs and badge systems for partners.', 'partners', 'commons', 8, false),

-- FUNCTIONS / VALUE SYSTEM (11)
('game-theory', 'Economic Game Theory', 'Economic models and game theory discussions.', 'functions', 'commons', 9, false),
('function-ideas', 'Function Ideas', 'Propose and discuss new function concepts.', 'functions', 'commons', 10, false),
('hunting', 'Hunting', 'Resource discovery and acquisition strategies.', 'functions', 'commons', 11, false),
('property', 'Property', 'Property rights and ownership discussions.', 'functions', 'commons', 12, false),
('parenting', 'Parenting', 'Community growth and mentorship.', 'functions', 'commons', 13, false),
('governance', 'Governance', 'Decision-making and governance structures.', 'functions', 'commons', 14, false),
('organizations', 'Organizations', 'Organizational design and coordination.', 'functions', 'commons', 15, false),
('curation', 'Curation', 'Content and quality curation systems.', 'functions', 'commons', 16, false),
('farming', 'Farming', 'Value creation and cultivation strategies.', 'functions', 'commons', 17, false),
('portal', 'Portal', 'Gateway and integration discussions.', 'functions', 'commons', 18, false),
('communication', 'Communication', 'Communication protocols and systems.', 'functions', 'commons', 19, false),

-- OTHERS (5)
('meta-discussion', 'Meta-discussion', 'Discussion about the Society Protocol Forum itself.', 'others', 'commons', 24, false),
('politics-society', 'Politics & Society', 'Political impacts on society and optimization.', 'others', 'commons', 25, false),
('economics', 'Economics', 'Economic models and theories.', 'others', 'commons', 26, false),
('crypto-web3', 'Cryptocurrencies & Web3', 'The broader crypto and web3 landscape.', 'others', 'commons', 27, false),
('off-topic', 'Off-topic', 'Anything unrelated to the protocol.', 'others', 'commons', 28, false);

-- ============================================
-- 11. SEED DATA — Research Categories (6)
-- ============================================

INSERT INTO research_categories (slug, name, description, display_order, color) VALUES
('architecture', 'Architecture', 'High-level system architecture and design patterns.', 1, '#3b82f6'),
('state-machine', 'State Machine', 'State transitions and machine logic discussions.', 2, '#a855f7'),
('consensus', 'Consensus', 'Consensus mechanisms and proof systems.', 3, '#f97316'),
('cryptography', 'Cryptography', 'Cryptographic primitives and security protocols.', 4, '#ef4444'),
('account-system', 'Account System', 'Account models and identity systems.', 5, '#06b6d4'),
('security', 'Security', 'Security analysis and threat modeling.', 6, '#eab308');

-- ============================================
-- SCHEMA COMPLETE
-- Tables: 8 (forum_boards, forum_threads, forum_replies,
--             research_categories, research_publications,
--             communities, community_threads, community_replies)
-- Functions: 14
-- Seed: 28 boards + 6 research categories
-- ============================================
