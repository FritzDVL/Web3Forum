-- ============================================
-- Add Missing Technical Feeds
-- Created: 2026-03-01
-- Purpose: Add 3 missing locked technical feeds
-- ============================================

-- Add Architectural Objects & Functions (after feed-20)
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured) VALUES
('feed-20a', 'Architectural Objects & Functions', 'Core architectural components and their functions.', 'technical', 20.5, true, false);

-- Add Account System (after feed-23)
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured) VALUES
('feed-23a', 'Account System', 'User accounts, authentication, and identity management.', 'technical', 23.5, true, false);

-- Add Security (after Account System)
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured) VALUES
('feed-23b', 'Security', 'Security protocols, vulnerabilities, and best practices.', 'technical', 23.7, true, false);

-- ============================================
-- Note: These feeds use placeholder addresses
-- Replace with real Lens Protocol addresses when available
-- ============================================
