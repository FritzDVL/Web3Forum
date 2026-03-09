# Quick Start Checklist - Custom Agent Setup

**Date:** March 9, 2026  
**Status:** ✅ Ready to Use!

---

## ✅ What's Been Created

### 1. Custom Agent Configuration
**File:** `.kiro/agents/web3-forum-dev.json`

**Features:**
- ✅ Pre-loaded with all your bug fix documentation
- ✅ Lens Protocol quick reference
- ✅ Safe file writing (only in project folders)
- ✅ Automatic git status on startup
- ✅ Keyboard shortcut: `Ctrl+Shift+W`
- ✅ Specialized prompt for Web3/Lens development

### 2. Documentation Files
**All in MyDataSource folder:**
- ✅ BugFixPlan.md - Detailed bug list with solutions
- ✅ CodebaseAnalysisSummary.md - Architecture overview
- ✅ QuickWinsGuide.md - Implementation guide
- ✅ LensIntegrationExplained.md - How Lens works
- ✅ AgentUsageGuide.md - How to use your agent (NEW!)

### 3. Skills (Progressive Loading)
**File:** `.kiro/skills/lens-protocol.md`
- ✅ Lens Protocol API quick reference
- ✅ Common patterns and examples
- ✅ Loads on-demand when needed

---

## 🚀 How to Start Using Your Agent

### Step 1: Activate the Agent
```bash
/agent
```
Then select: **web3-forum-dev**

Or use keyboard shortcut: `Ctrl+Shift+W`

### Step 2: Verify It's Loaded
You should see:
```
✓ Switched to agent: web3-forum-dev
Ready to fix Web3 Forum bugs! I have your bug fix plan and 
codebase analysis loaded. What should we work on?
```

### Step 3: Check What's Loaded
```bash
/context
```
Should show:
- BugFixPlan.md
- CodebaseAnalysisSummary.md
- QuickWinsGuide.md
- LensIntegrationExplained.md
- AgentUsageGuide.md
- package.json
- tsconfig.json

### Step 4: Start Fixing Bugs!
```
You: Let's fix bug #6 - notifications not working.
     Check BugFixPlan.md for details.
```

---

## 📋 Your First Bug Fix Session

### Example: Fix Notifications (Bug #6)

**Step 1: Start the conversation**
```
You: Let's fix bug #6 from BugFixPlan.md - notifications completely broken
```

**Step 2: Agent investigates**
The agent will:
- Read BugFixPlan.md (already loaded)
- Search for notification files
- Check the hook implementation
- Identify the issue

**Step 3: Agent proposes solution**
```
Agent: Found the issue in hooks/notifications/use-notifications.ts
       The getAllNotifications service isn't being called correctly.
       Here's what needs to change: [shows code]
       Should I implement this?
```

**Step 4: You approve or steer**
```
You: Yes, but first check if the Lens API permissions are correct

Agent: Good point! Let me check the session client setup...
```

**Step 5: Implement and test**
```
Agent: [Implements fix]
       Done! Test by:
       1. Go to /notifications
       2. Check if notifications load
       3. Try liking a post and see if notification appears

You: [Tests in browser]
     Still not working. Console shows: "sessionClient.data is undefined"

Agent: Ah! The session isn't initialized. Let me check the auth flow...
```

---

## 🎯 Recommended Bug Fixing Order

Based on BugFixPlan.md, here's the suggested order:

### Phase 1: Critical Bugs (Week 1)
```
1. /agent → web3-forum-dev
   "Fix bug #6 - notifications not working"

2. "Fix bug #9 - unable to join communities"

3. "Fix bug #5 - switch account doesn't work"

4. "Fix bug #2 - unclear error messages"
```

### Phase 2: Core Functionality (Week 2)
```
5. "Fix bug #4 - add voting to feed posts (hearts only)"

6. "Fix bug #3 - add search to navbar"

7. "Fix bug #10 - post count shows 0"

8. "Fix bug #11 - add avatars to posts"
```

### Phase 3: Features & Cleanup (Week 3)
```
9. "Add security measures - rate limiting"

10. "Remove rewards system"

11. "Fix bug #1 - make links clickable"
```

---

## 💡 Pro Tips for Working With Your Agent

### 1. Always Reference Documentation
```
✅ "Fix bug #6 from BugFixPlan.md"
✅ "Use the pattern from QuickWinsGuide.md"
✅ "Check LensIntegrationExplained.md for how voting works"
```

### 2. Provide Error Messages
```
✅ "Getting error: sessionClient.data is undefined"
✅ "Console shows: TypeError at line 45"
✅ "Network tab shows 403 Forbidden"
```

### 3. Describe What You See
```
✅ "Button shows but nothing happens when clicked"
✅ "Notification count is 0 but I have unread notifications"
✅ "Avatar shows placeholder instead of actual image"
```

### 4. Ask for Explanation First
```
✅ "Explain how notifications work before we fix them"
✅ "Show me the data flow for joining communities"
✅ "What's the difference between sessionClient and walletClient?"
```

### 5. Iterate on Solutions
```
✅ "That works but can we make it simpler?"
✅ "Good, now add error handling"
✅ "Can we reuse the pattern from thread-voting.tsx?"
```

---

## 🔧 Agent Capabilities

### What Your Agent CAN Do:
- ✅ Read all your code files
- ✅ Search through the entire codebase
- ✅ Understand component relationships
- ✅ Trace data flow between files
- ✅ Access all pre-loaded documentation
- ✅ Execute safe bash commands (git, npm)
- ✅ Write/modify code files (with approval)
- ✅ Explain complex concepts
- ✅ Find patterns in existing code
- ✅ Debug issues systematically

### What Your Agent CANNOT Do:
- ❌ See your browser UI (no screenshots)
- ❌ Run the app and test it
- ❌ Click buttons or interact with UI
- ❌ See runtime errors in browser console
- ❌ Access your database directly
- ❌ Know what's happening in real-time

### How to Bridge the Gap:
**You test, agent codes:**
1. Agent implements fix
2. You test in browser
3. You report results
4. Agent adjusts based on feedback
5. Repeat until working

---

## 🎓 Understanding Agent Behavior

### The Agent Works Best When You:

**1. Give Context**
```
Good: "Fix bug #6 - notifications. Check BugFixPlan.md"
Bad:  "Fix notifications"
```

**2. Be Specific**
```
Good: "The join button in join-community-button.tsx doesn't call the hook"
Bad:  "Join doesn't work"
```

**3. Provide Feedback**
```
Good: "That fixed the button but now it shows 'undefined' as the community name"
Bad:  "Still broken"
```

**4. Reference Existing Code**
```
Good: "Use the same pattern as thread-voting.tsx but for feed posts"
Bad:  "Add voting"
```

### The Agent Will:
- Read your documentation automatically
- Search for similar patterns in your code
- Explain what it's doing and why
- Ask for approval before making changes
- Suggest testing steps
- Iterate based on your feedback

---

## 📚 Adding More Documentation

### Option 1: Add to Skills (Recommended)
Create `.kiro/skills/your-topic.md`:

```markdown
---
name: your-topic-name
description: When to use this skill
---

# Your Documentation

[Content here]
```

Then update agent config:
```json
{
  "resources": [
    "skill://.kiro/skills/your-topic.md"
  ]
}
```

### Option 2: Add to Resources (Always Loaded)
```json
{
  "resources": [
    "file://docs/your-doc.md"
  ]
}
```

### Option 3: Paste in Chat (Temporary)
```
You: Here's the Lens Protocol documentation for feeds:
     [paste docs]
     
     Now help me implement feed pagination

Agent: [Reads and uses the docs]
```

---

## 🔍 Useful Commands During Bug Fixing

### Check Context
```bash
/context              # See what files are loaded
/hooks                # See configured hooks
/tools                # See available tools
```

### Manage Conversation
```bash
/editor               # Open editor for long prompts
/compact              # Free up context space
/clear                # Start fresh (careful!)
```

### Save Progress
```bash
/chat save            # Save current conversation
/chat load            # Load saved conversation
```

### Check Usage
```bash
/usage                # See credit usage
/model                # Check/change model
```

---

## 🚨 Troubleshooting

### Agent Not Showing Up
```bash
# List all agents
kiro-cli agent list

# Should show: web3-forum-dev

# If not, check file exists
ls .kiro/agents/web3-forum-dev.json
```

### Documentation Not Loading
```bash
# Check files exist
ls MyDataSource/BugFixPlan.md
ls .kiro/skills/lens-protocol.md

# If missing, agent will tell you
```

### Agent Seems Confused
```bash
# Clear and restart
/clear

# Then reactivate agent
/agent → web3-forum-dev
```

### Want to Modify Agent
```bash
# Edit config
code .kiro/agents/web3-forum-dev.json

# Restart chat or switch agents
/agent
```

---

## 🎉 You're All Set!

### What You Have Now:
1. ✅ Custom agent configured for Web3 forum development
2. ✅ All bug documentation pre-loaded
3. ✅ Lens Protocol quick reference
4. ✅ Comprehensive usage guide
5. ✅ Systematic bug fixing workflow

### Next Steps:
1. **Activate agent:** `/agent` → select "web3-forum-dev"
2. **Start with Phase 1:** Critical bugs from BugFixPlan.md
3. **Work systematically:** One bug at a time
4. **Test as you go:** You test, agent codes
5. **Iterate:** Provide feedback, agent adjusts

### Remember:
- The agent is your coding partner, not a magic wand
- You still need to test in the browser
- Provide clear feedback on what works/doesn't work
- Reference the documentation (it's pre-loaded!)
- Ask for explanations when confused

---

## 📞 Quick Reference Card

```
┌─────────────────────────────────────────────┐
│  ACTIVATE AGENT                             │
│  /agent → web3-forum-dev                    │
│  OR: Ctrl+Shift+W                           │
├─────────────────────────────────────────────┤
│  START BUG FIX                              │
│  "Fix bug #X from BugFixPlan.md"            │
├─────────────────────────────────────────────┤
│  CHECK CONTEXT                              │
│  /context                                   │
├─────────────────────────────────────────────┤
│  PROVIDE FEEDBACK                           │
│  "That works!" or "Error: [paste error]"    │
├─────────────────────────────────────────────┤
│  SAVE PROGRESS                              │
│  /chat save                                 │
└─────────────────────────────────────────────┘
```

**Happy bug fixing! 🚀**

---

**Questions?** Just ask your agent:
```
"How do I use you to fix bugs?"
"What documentation do you have loaded?"
"Explain how the voting system works"
```
