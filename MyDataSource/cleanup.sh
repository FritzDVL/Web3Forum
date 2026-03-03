#!/bin/bash

# Society Protocol Forum - Documentation Hard Reset Cleanup
# Generated: 2026-02-26
# Purpose: Remove unused components and archive old documentation

set -e

echo "🧹 Starting cleanup process..."

# 1. Archive old Context.md
echo "📦 Archiving old Context.md..."
if [ -f "MyDataSource/Context.md" ]; then
    mv MyDataSource/Context.md MyDataSource/Context.old.md
    echo "✅ Archived to Context.old.md"
else
    echo "⚠️  Context.md not found (may have been replaced)"
fi

# 2. Delete unused home components
echo "🗑️  Removing unused home components..."

UNUSED_COMPONENTS=(
    "components/home/featured-communities.tsx"
    "components/home/hero-section.tsx"
    "components/home/stats-bar.tsx"
    "components/home/thread-list-item.tsx"
    "components/home/thread-votes-display.tsx"
    "components/home/threads-list.tsx"
    "components/home/threads-switcher.tsx"
)

for component in "${UNUSED_COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        rm "$component"
        echo "  ✅ Deleted: $component"
    else
        echo "  ⚠️  Not found: $component"
    fi
done

# 3. Summary
echo ""
echo "✨ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Archived: Context.old.md"
echo "  - Deleted: 7 unused home components"
echo "  - Preserved: codebase.md (reference)"
echo "  - Preserved: community components (still in use by LOCAL section)"
echo ""
echo "📝 New documentation:"
echo "  - context.md (reality-based spec)"
echo "  - DIVERGENCE_ANALYSIS.md (comparison report)"
echo ""
echo "🚀 Next steps:"
echo "  1. Review new context.md"
echo "  2. Implement /commons/[address] route"
echo "  3. Connect Lens Protocol feeds"
echo ""
