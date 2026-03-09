# How to Use Your Custom Web3 Forum Agent

**Created:** March 9, 2026  
**Agent Name:** web3-forum-dev

---

## 🎯 What This Agent Does

Your custom agent is now configured with:
- ✅ All your bug fix documentation pre-loaded
- ✅ Codebase analysis and patterns
- ✅ Lens Protocol integration knowledge
- ✅ Automatic git status on startup
- ✅ Safe file writing (only in your project folders)
- ✅ Keyboard shortcut: `Ctrl+Shift+W`

---

## 🚀 How to Activate Your Agent

### Method 1: Slash Command (In Chat)
```bash
/agent
```
Then select "web3-forum-dev" from the list.

### Method 2: Keyboard Shortcut
Press `Ctrl+Shift+W` anytime during chat to switch to this agent.

### Method 3: Start Chat With Agent
```bash
kiro-cli chat --agent web3-forum-dev
```

---

## 💬 How to Talk to Your Agent

### The Agent Works Like This:

**You:** "Fix bug #6 - notifications not working"

**Agent will:**
1. Read BugFixPlan.md (already loaded in context)
2. Search for notification-related files
3. Check the working implementation
4. Identify the issue
5. Propose a fix
6. Implement it (with your approval)

### Example Conversations:

#### Example 1: Fix a Specific Bug
```
You: Let's fix bug #9 - unable to join communities. 
     Check the BugFixPlan for details.

Agent: [Reads BugFixPlan.md from context]
       I see the issue. The useJoinCommunity hook exists but 
       isn't properly connected. Let me check the implementation...
       [Searches code]
       Found it! The issue is in components/communities/display/join-community-button.tsx
       [Shows the fix]
       Should I implement this?

You: Yes, go ahead.

Agent: [Implements fix]
       Done! The join button now properly calls the hook.
       Test by clicking join on any community.
```

#### Example 2: Add a Feature
```
You: Add the search component to the navbar. 
     Use Option A from QuickWinsSummary.md

Agent: [Reads QuickWinsSummary.md from context]
       I'll add the UserSearch component to navbar-desktop.tsx
       [Shows code changes]
       This will add search between Home and notifications.
       Proceed?

You: Yes

Agent: [Implements]
       Search is now in the navbar!
```

#### Example 3: Understand Something
```
You: Explain how the voting system works in this codebase

Agent: [Reads LensIntegrationExplained.md from context]
       The voting system uses:
       1. useVoting hook (hooks/common/use-voting.ts)
       2. LikeButton component (components/ui/like-button.tsx)
       3. Lens Protocol addReaction API
       [Explains the flow with code examples]
```

---

## 🎨 Visual Analysis - What the Agent CAN and CANNOT Do

### ✅ What It CAN Do:
- Read and analyze code files
- Search through your entire codebase
- Understand component relationships
- Trace data flow between files
- Read your documentation (already loaded!)
- Execute safe bash commands (git status, npm commands)
- Write/modify code files

### ❌ What It CANNOT Do:
- See your actual browser/UI (no screenshots)
- Run the app and test it visually
- Click buttons or interact with UI
- See runtime errors in browser console
- Access your database directly

### 💡 How to Help It "See":
If you need visual analysis:

**Option 1: Describe what you see**
```
You: The join button shows but when I click it, nothing happens.
     Console shows: "sessionClient.data is undefined"

Agent: Ah! The issue is authentication. Let me check...
```

**Option 2: Paste error messages**
```
You: Getting this error:
     TypeError: Cannot read property 'data' of undefined
     at useJoinCommunity (use-join-community.ts:15)

Agent: The sessionClient isn't initialized. Let me check the auth flow...
```

**Option 3: Use the paste command**
```bash
/paste
```
Then paste a screenshot (if you have one) - though the agent works best with text descriptions.

---

## 🔧 How to Steer the Agent Through Your Bug List

### Strategy 1: Sequential Bug Fixing
```
You: Let's work through the bugs in BugFixPlan.md
     Start with Phase 1 - Critical Bugs
     First: Bug #6 - Notifications

Agent: [Reads plan, starts working]

You: Good! Now bug #9 - Join community

Agent: [Continues]
```

### Strategy 2: Give It Context
```
You: I want to fix all the voting-related bugs.
     Check BugFixPlan.md for bug #4 (upvotes/downvotes)
     But remember: I changed it to hearts-only (see QuickWinsGuide.md)

Agent: [Reads both docs, understands the context]
       Got it! Hearts-only voting. Let me check the current implementation...
```

### Strategy 3: Let It Explore
```
You: The notifications aren't working. 
     Find out why by checking:
     1. The hook implementation
     2. The service layer
     3. The Lens API calls

Agent: [Searches systematically]
       Found 3 potential issues:
       1. sessionClient not authenticated
       2. API permissions missing
       3. Component not re-rendering
       Let me investigate each...
```

---

## 📋 Systematic Bug Fixing Workflow

### Step 1: Choose a Bug
```
You: Let's fix bug #10 - post count shows 0
```

### Step 2: Agent Investigates
The agent will automatically:
- Read BugFixPlan.md (already in context)
- Search for related files
- Check working examples
- Identify the issue

### Step 3: Agent Proposes Solution
```
Agent: Found the issue in hooks/profile/use-profile-data.ts
       The getAccountStats service isn't returning the correct data.
       Here's the fix: [shows code]
       Should I implement this?
```

### Step 4: You Approve or Steer
```
You: Yes, but also check if the database trigger is working

Agent: Good point! Let me check the migration file...
       [Checks supabase/migrations/...]
       The trigger looks correct. The issue is in the service layer.
```

### Step 5: Implement & Test
```
Agent: [Implements fix]
       Done! Now test by:
       1. Visit your profile
       2. Check if post count shows correctly
       
You: Still showing 0

Agent: Let me check the Lens API response...
       [Investigates further]
```

---

## 🎯 Best Practices for Working With Your Agent

### DO:
✅ Reference your documentation files (they're pre-loaded!)
✅ Be specific about which bug you're fixing
✅ Paste error messages when you see them
✅ Tell it when something doesn't work
✅ Ask it to explain before implementing
✅ Let it search the codebase for patterns

### DON'T:
❌ Assume it can see your browser
❌ Ask it to test the UI (you need to do that)
❌ Expect it to know runtime state
❌ Give vague descriptions like "it's broken"

### GOOD Examples:
```
✅ "Fix bug #6 from BugFixPlan.md - notifications not working"
✅ "Add search to navbar using the pattern from QuickWinsGuide.md"
✅ "The join button throws: sessionClient.data is undefined"
✅ "Explain how the voting system works, then help me add it to feed posts"
```

### BAD Examples:
```
❌ "Fix the notifications" (too vague, which notifications?)
❌ "It doesn't work" (what doesn't work? what error?)
❌ "Make it look better" (agent can't see UI)
❌ "Test if it works" (agent can't run browser tests)
```

---

## 🔄 Agent Workflow Example: Full Bug Fix

Let's walk through fixing Bug #9 (Join Community):

```
You: Let's fix bug #9 - unable to join communities.
     Check BugFixPlan.md for the details.

Agent: Reading BugFixPlan.md...
       
       Bug #9: Unable to Join Communities
       - Join button doesn't work
       - Solution exists: hooks/communities/use-join-community.ts
       - Need to debug hook integration
       
       Let me search for the join button component...
       [Searches]
       
       Found: components/communities/display/join-community-button.tsx
       Let me read it...
       [Reads file]
       
       I see the issue! The component isn't calling the hook correctly.
       Current code:
       ```tsx
       const handleJoin = () => {
         // Missing implementation
       }
       ```
       
       Should be:
       ```tsx
       const join = useJoinCommunity(community);
       const handleJoin = async () => {
         await join();
       }
       ```
       
       Should I implement this fix?

You: Yes, but first check if the hook itself works

Agent: Good idea! Let me read the hook implementation...
       [Reads hooks/communities/use-join-community.ts]
       
       The hook looks correct:
       - Checks sessionClient ✓
       - Checks walletClient ✓
       - Calls joinCommunity service ✓
       - Shows toast notifications ✓
       
       The hook is fine. The issue is just the button not calling it.
       Implementing fix now...
       [Modifies join-community-button.tsx]
       
       Done! Changes:
       1. Added useJoinCommunity hook call
       2. Connected handleJoin to the hook
       3. Added loading state
       
       Test by:
       1. Go to any community page
       2. Click "Join Community" button
       3. Should show "Joining community..." toast
       4. Then "You have joined the community!" on success

You: Testing... it works! But the button doesn't update to "Leave"

Agent: Ah, we need to refresh the membership state.
       Let me check how other components handle this...
       [Searches for similar patterns]
       
       Found the pattern in thread components.
       We need to add a state refresh after joining.
       Should I add that?

You: Yes

Agent: [Implements state refresh]
       Done! Now the button should update immediately after joining.
```

---

## 📚 What Documentation Is Pre-Loaded

Your agent has these files in its context automatically:

1. **BugFixPlan.md** - All bugs with implementation details
2. **CodebaseAnalysisSummary.md** - Architecture and patterns
3. **QuickWinsGuide.md** - Quick wins implementation
4. **LensIntegrationExplained.md** - How Lens Protocol works
5. **package.json** - Dependencies
6. **tsconfig.json** - TypeScript config

**This means:** You can reference these files by name and the agent already knows them!

---

## 🎓 Adding More Documentation

Want to add Lens Protocol official docs or other resources?

### Option 1: Add as Resource Files
Create `.kiro/skills/lens-protocol.md`:

```markdown
---
name: lens-protocol-api
description: Official Lens Protocol API documentation. Use when working with Lens SDK.
---

# Lens Protocol API Reference

[Paste documentation here]
```

Then update your agent config:
```json
{
  "resources": [
    "skill://.kiro/skills/lens-protocol.md"
  ]
}
```

### Option 2: Just Paste It In Chat
```
You: Here's the Lens Protocol documentation for reactions:
     [paste docs]
     
     Now help me implement voting using this API

Agent: [Reads the docs you pasted]
       Got it! Based on this documentation...
```

---

## 🔍 Advanced: Hooks for Automatic Checks

Your agent already has a hook that runs `git status` when it starts.

Want to add more? Edit `.kiro/agents/web3-forum-dev.json`:

```json
{
  "hooks": {
    "agentSpawn": [
      {
        "command": "git status --short",
        "description": "Show git status"
      },
      {
        "command": "npm run lint -- --quiet",
        "description": "Check for lint errors"
      }
    ],
    "preToolUse": [
      {
        "matcher": "fs_write",
        "command": "git diff --stat",
        "description": "Show what will change"
      }
    ]
  }
}
```

---

## 🎯 Quick Reference Commands

### Switch to Your Agent
```bash
/agent                    # Interactive picker
Ctrl+Shift+W             # Keyboard shortcut
```

### Check What's Loaded
```bash
/context                 # See all loaded files
/hooks                   # See configured hooks
/tools                   # See available tools
```

### During Bug Fixing
```bash
/editor                  # Open editor for long prompts
/compact                 # Free up context space if needed
/usage                   # Check credit usage
```

---

## 💡 Pro Tips

1. **Start conversations with context:**
   ```
   "Let's fix bug #6. Check BugFixPlan.md for details."
   ```

2. **Reference existing patterns:**
   ```
   "Add voting like in thread-voting.tsx but for feed posts"
   ```

3. **Ask for explanation first:**
   ```
   "Explain how notifications work before we fix them"
   ```

4. **Iterate on fixes:**
   ```
   "That fix works but can we make it simpler?"
   ```

5. **Use the agent's memory:**
   ```
   "Remember how we fixed the join button? Do the same for leave"
   ```

---

## 🚨 Troubleshooting

### Agent Not Found
```bash
# Check if agent exists
kiro-cli agent list

# Should show: web3-forum-dev
```

### Agent Not Loading Docs
```bash
# Check resources are accessible
ls MyDataSource/BugFixPlan.md

# If missing, the agent will tell you
```

### Want to Modify Agent
```bash
# Edit the config
code .kiro/agents/web3-forum-dev.json

# Then restart chat or switch agents
/agent
```

---

## 🎉 You're Ready!

Your agent is configured and ready to help you systematically fix all the bugs in your Web3 forum.

**Next steps:**
1. Activate the agent: `/agent` → select "web3-forum-dev"
2. Start with Phase 1 bugs from BugFixPlan.md
3. Work through them systematically
4. The agent has all your documentation loaded!

**Remember:** The agent is a coding partner, not a magic wand. You still need to:
- Test the fixes in your browser
- Provide feedback on what works/doesn't work
- Steer it when it goes off track
- Approve changes before implementation

**Happy bug fixing! 🚀**
