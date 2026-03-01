-- ============================================
-- Fix Technical Feeds - Ensure All 7 Are Present
-- Created: 2026-03-02
-- Purpose: Ensure correct order and naming of technical feeds
-- ============================================

-- First, let's make sure we have all 7 feeds with correct names and order
-- Delete any existing technical feeds to start fresh
DELETE FROM feeds WHERE category = 'technical';

-- Insert all 7 technical feeds in correct order
INSERT INTO feeds (lens_feed_address, title, description, category, display_order, is_locked, featured) VALUES
('feed-20', 'General Architecture Discussion', 'High-level system architecture and design patterns.', 'technical', 20, true, false),
('feed-21', 'State Machine', 'State transitions and machine logic discussions.', 'technical', 21, true, false),
('feed-21a', 'Architectural Objects & Functions', 'Core architectural components and their functions.', 'technical', 21.5, true, false),
('feed-22', 'Consensus (Proof of Hunt)', 'Consensus mechanisms and proof systems.', 'technical', 22, true, false),
('feed-23', 'Cryptography', 'Cryptographic primitives and security protocols.', 'technical', 23, true, false),
('feed-23a', 'Account System', 'User accounts, authentication, and identity management.', 'technical', 23.5, true, false),
('feed-23b', 'Security', 'Security protocols, vulnerabilities, and best practices.', 'technical', 23.7, true, false);

-- ============================================
-- Final Technical Section (7 feeds):
-- 1. General Architecture Discussion (feed-20)
-- 2. State Machine (feed-21)
-- 3. Architectural Objects & Functions (feed-21a) ← ADDED
-- 4. Consensus (Proof of Hunt) (feed-22)
-- 5. Cryptography (feed-23)
-- 6. Account System (feed-23a)
-- 7. Security (feed-23b)
-- ============================================
