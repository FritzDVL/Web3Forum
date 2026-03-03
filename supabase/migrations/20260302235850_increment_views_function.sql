-- Function to atomically increment view count
CREATE OR REPLACE FUNCTION increment_views(post_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE feed_posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE lens_post_id = post_id;
END;
$$;
