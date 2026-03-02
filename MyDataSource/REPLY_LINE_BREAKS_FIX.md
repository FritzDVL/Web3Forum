# Fixed: Reply Line Breaks Not Preserved

## Problem

When creating replies (comments on posts), line breaks created with Shift+Enter were being removed, causing all paragraphs to merge into one continuous block of text.

## Root Cause

Replies were using `textOnly()` metadata type from Lens Protocol, which doesn't support markdown or preserve line breaks properly. It treats content as plain text.

## Solution

Changed replies to use `article()` metadata type instead, which:
- Supports markdown formatting
- Preserves line breaks and paragraph spacing
- Treats content as rich text (same as main posts)

## Files Changed

### 1. `lib/services/feed/create-feed-reply.ts`
- Changed from `textOnly({ content })` to `article({ content })`
- Feed post replies now preserve formatting

### 2. `lib/services/reply/create-reply.ts`
- Changed from `textOnly({ content })` to `article({ content })`
- Thread/community replies now preserve formatting

## What Now Works

✅ Line breaks in replies are preserved  
✅ Multiple paragraphs display with proper spacing  
✅ Markdown formatting works in replies (bold, italic, etc.)  
✅ Consistent behavior between posts and replies  
✅ Works for both feed replies and thread/community replies  

## Technical Details

**Before:**
```typescript
const metadata = textOnly({ content });
// Result: "Line 1Line 2Line 3" (no breaks)
```

**After:**
```typescript
const metadata = article({ content });
// Result: "Line 1\n\nLine 2\n\nLine 3" (breaks preserved)
```

The `article()` metadata type is the same one used for creating main posts, ensuring consistent formatting across all content types.

## Testing

1. Create a reply with multiple paragraphs (use Shift+Enter)
2. Submit the reply
3. Reply should display with proper paragraph spacing
4. Works for both:
   - Feed post replies (Commons section)
   - Thread replies (Communities section)
