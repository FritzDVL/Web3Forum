#!/bin/bash

# Apply feed stats migration to Supabase

echo "Applying feed stats migration..."

# Check if SUPABASE_URL and SUPABASE_ANON_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set"
  echo "Please set them in your .env file or export them"
  exit 1
fi

# Apply the migration
psql "$DATABASE_URL" < supabase/migrations/20260302_add_feed_stats.sql

echo "Migration applied successfully!"
echo ""
echo "New columns added to feeds table:"
echo "  - replies_count (INTEGER)"
echo "  - views_count (INTEGER)"
echo "  - last_post_at (TIMESTAMP)"
echo ""
echo "Triggers created to automatically update these stats when posts are created or updated."
