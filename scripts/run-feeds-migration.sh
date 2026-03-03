#!/bin/bash

# Run Feeds Migration Script
# Created: 2026-02-27
# Purpose: Execute feeds table creation and seed data

set -e

echo "🚀 Starting feeds migration..."

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if Supabase URL is set
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL not found in .env.local"
    exit 1
fi

echo "📊 Supabase URL: $SUPABASE_URL"

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's/https:\/\/([^.]+).*/\1/')
echo "📦 Project Ref: $PROJECT_REF"

echo ""
echo "⚠️  Manual Migration Required"
echo ""
echo "Please run these SQL files in your Supabase SQL Editor:"
echo ""
echo "1. Open: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "2. Copy and run: supabase/migrations/20260227_create_feeds_tables.sql"
echo "   This creates the feeds and feed_posts tables"
echo ""
echo "3. Copy and run: supabase/migrations/20260227_seed_feeds_data.sql"
echo "   This inserts the 28 feeds from commons-config.ts"
echo ""
echo "✅ After running both files, all 28 feed links will work!"
echo ""
