-- ============================================
-- Verify Technical Feeds in Database
-- Run this in Supabase SQL Editor to check
-- ============================================

-- Check all technical feeds
SELECT 
  id, 
  lens_feed_address, 
  title, 
  display_order, 
  is_locked,
  created_at
FROM feeds 
WHERE category = 'technical' 
ORDER BY display_order;

-- Count total feeds
SELECT category, COUNT(*) as count
FROM feeds
GROUP BY category
ORDER BY category;
