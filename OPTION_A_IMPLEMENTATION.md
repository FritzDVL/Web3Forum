# Option A Implementation: Lifted State Architecture ✅

## What Changed

### Before (Problematic):
```
PostDetail.tsx
  ↓ calls useFeedReplyForm() to get optimisticReplies
  ↓ (hook runs even when not needed)
  ↓ passes to ReplyForm & ReplyList
```

### After (Fixed):
```
PostDetail.tsx
  ↓ manages optimisticReplies state with useState()
  ↓ passes state + setState to ReplyForm
  ↓ passes state to ReplyList
  
ReplyForm.tsx
  ↓ receives optimisticReplies & setOptimisticReplies as props
  ↓ passes to useFeedReplyForm() hook
  ↓ hook only runs when form is rendered
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ PostDetail (Parent Component)                          │
│                                                         │
│ State:                                                  │
│   const [optimisticReplies, setOptimisticReplies] =   │
│     useState<OptimisticReply[]>([])                    │
│                                                         │
│ Props from server:                                      │
│   replies: Reply[]                                      │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ↓                       ↓
┌──────────────────┐    ┌──────────────────┐
│ ReplyForm        │    │ ReplyList        │
│                  │    │                  │
│ Props:           │    │ Props:           │
│ - optimistic     │    │ - replies        │
│ - setOptimistic  │    │ - optimistic     │
│                  │    │                  │
│ Calls hook:      │    │ Merges:          │
│ useFeedReplyForm │    │ [...opt, ...real]│
└──────────────────┘    └──────────────────┘
```

## Benefits

1. **Clear Data Flow**: State lives in one place, flows down
2. **No Hook Issues**: Hook only runs when form is rendered
3. **Easier Debugging**: Can inspect state in PostDetail
4. **Better Performance**: Hook doesn't run unnecessarily
5. **Type Safety**: Props are explicitly typed

## Files Modified

1. **hooks/feeds/use-feed-reply-form.ts**
   - Changed signature to accept props object
   - Receives `optimisticReplies` and `setOptimisticReplies` as params
   - Removed internal useState for optimistic replies
   - Removed optimisticReplies from return value

2. **components/commons/reply-form.tsx**
   - Added props: `optimisticReplies`, `setOptimisticReplies`
   - Passes props to hook
   - No longer gets optimisticReplies from hook return

3. **components/commons/post-detail.tsx**
   - Added useState for optimisticReplies
   - Removed useFeedReplyForm call
   - Passes state down to ReplyForm and ReplyList

## Testing

The implementation should now work without errors:

1. Navigate to a post
2. Write a reply
3. Click "Post Reply"
4. See optimistic reply appear instantly
5. After 2 seconds, page refreshes with real reply

## Error Resolution

This fixes the sessionClient error because:
- Hook no longer runs on every PostDetail render
- Hook only runs inside ReplyForm (which is always rendered)
- State management is explicit and controlled
- No unexpected hook calls or dependencies
