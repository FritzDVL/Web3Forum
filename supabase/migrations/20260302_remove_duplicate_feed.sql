-- ============================================
-- Remove Duplicate Technical Feed
-- Created: 2026-03-02
-- Purpose: Remove "General Architecture Discussion" duplicate
-- ============================================

-- Delete the duplicate feed
DELETE FROM feeds 
WHERE lens_feed_address = 'feed-20' 
AND title = 'General Architecture Discussion';

-- ============================================
-- This leaves 6 technical feeds:
-- 1. Architectural Objects & Functions (feed-20a)
-- 2. State Machine (feed-21)
-- 3. Consensus (Proof of Hunt) (feed-22)
-- 4. Cryptography (feed-23)
-- 5. Account System (feed-23a)
-- 6. Security (feed-23b)
-- ============================================
