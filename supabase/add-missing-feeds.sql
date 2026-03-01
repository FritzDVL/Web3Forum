-- ============================================
-- Add 3 Missing Technical Feeds
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Architectural Objects & Functions
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured) 
VALUES ('feed-20a', 'Architectural Objects & Functions', 'Core architectural components and their functions.', 'technical', 20.5, true, false);

-- 2. Account System  
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured)
VALUES ('feed-23a', 'Account System', 'User accounts, authentication, and identity management.', 'technical', 23.5, true, false);

-- 3. Security
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured)
VALUES ('feed-23b', 'Security', 'Security protocols, vulnerabilities, and best practices.', 'technical', 23.7, true, false);

-- Verify the inserts
SELECT id, lens_feed_address, title, category, display_order, is_locked 
FROM feeds 
WHERE category = 'technical' 
ORDER BY display_order;
