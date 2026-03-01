-- ============================================
-- Verify All Feeds Have Valid Addresses
-- Created: 2026-03-02
-- Purpose: Check that no feeds have placeholder addresses
-- ============================================

-- Check for any placeholder addresses (feed-XX format)
SELECT 
  category,
  title,
  lens_feed_address,
  CASE 
    WHEN lens_feed_address LIKE 'feed-%' THEN '❌ PLACEHOLDER'
    WHEN lens_feed_address LIKE '0x%' THEN '✅ VALID'
    ELSE '⚠️ UNKNOWN FORMAT'
  END as status
FROM feeds
ORDER BY category, display_order;

-- Count by status
SELECT 
  CASE 
    WHEN lens_feed_address LIKE 'feed-%' THEN 'Placeholder'
    WHEN lens_feed_address LIKE '0x%' THEN 'Valid Address'
    ELSE 'Unknown'
  END as address_type,
  COUNT(*) as count
FROM feeds
GROUP BY address_type;

-- List only feeds that still need addresses
SELECT 
  category,
  title,
  lens_feed_address
FROM feeds
WHERE lens_feed_address LIKE 'feed-%'
ORDER BY category, display_order;
