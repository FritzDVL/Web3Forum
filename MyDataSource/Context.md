# Society Protocol Forum - Technical Specification

**Last Updated**: 2026-03-01  
**Status**: Core Loop Complete - Production Ready ✅

what happens when I update my repo? The changes done locally will not propagate to the deployed version right? Even if I commit changes and make an pull request with a push to main It doesn't have anything to do with this VPS right?

> Correct. Your VPS has no connection to GitHub. Pushing to main does nothing to the live server automatically.

To deploy updates you need to SSH into the VPS and manually pull + rebuild:

bash
cd /var/www/Web3Forum
git pull origin main
npm install --legacy-peer-deps
npm run build
pm2 restart web3forum

That's the manual deploy flow. Every time you want changes live, you run those 5 commands on the VPS.

If you want this automated in the future, you could set up a GitHub Action that SSHes into the VPS and runs those commands on every push to main —
but that's optional and you don't need it now.

---

## Executive Summary

The forum is **fully functional** with complete feeds system, post creation, reply system, and pagination. All features are integrated with Lens Protocol blockchain. Ready for production deployment.

---

## 🎯 Current Status (2026-03-01)

### ✅ Completed Features

1. **Dynamic Feeds System**
   - 28 feeds loaded from Supabase database
   - 5 categories: General, Partners, Functions, Technical, Others
   - Database-driven (no hardcoded config)

2. **Post System**
   - Create posts with rich text editor
   - View posts in feed list
   - Post detail pages with full content
   - Posts written to Lens Protocol blockchain
   - Cached in Supabase for performance

3. **Reply System**
   - Reply to posts
   - View all replies chronologically
   - Replies written to Lens Protocol blockchain
   - Authentication required

4. **Pagination**
   - "Load More" button
   - Cursor-based pagination
   - Efficient data fetching

5. **Markdown Support**
   - GitHub Flavored Markdown (GFM)
   - Tables, strikethrough, task lists
   - Autolinks

---

## 🔧 App Identity Configuration

### Current Branding

**App Name**: "LensForum"  
**Location**: `lib/shared/constants.ts`

```typescript
// Mainnet
const MAINNET_APP_ADDRESS: Address = "0x30BB11c7A400cE65Fc13f345AA4c5FFC1C333603";
export const APP_NAME = isTestnet ? "LensForumV1" : "LensForum";

// Testnet
const TESTNET_APP_ADDRESS: Address = "0x9eD1562A4e3803964F3c84301b18d4E1944D340b";
```

### 📝 Pre-Launch Checklist: Rebranding

**When ready to deploy with your own brand:**

#### 1. Free Changes (No Cost)

```typescript
// lib/shared/constants.ts
export const APP_NAME = "YourAppName"; // Change app name
const MAINNET_APP_URL = "https://yourapp.com"; // Your domain
const TESTNET_APP_URL = "http://localhost:3000";

// lib/domain/threads/content.ts
export const THREAD_CONTENT_PREFIX = "YourApp Thread: "; // Thread prefix
```

#### 2. Optional: Register Your Own Lens App (Costs ~$1-5 gas)

**Steps:**

1. Register app on Lens Protocol dashboard
2. Get your app address (0x...)
3. Update constants:
   ```typescript
   const MAINNET_APP_ADDRESS: Address = "0xYOUR_APP_ADDRESS";
   const TESTNET_APP_ADDRESS: Address = "0xYOUR_TESTNET_ADDRESS";
   ```
4. Rebuild: `npm run build`

**Impact:**

- ✅ New posts show under your app name
- ❌ Old posts still show "LensForum" (blockchain immutable)
- ✅ No data loss or migration needed

**Recommendation**: Keep LensForum config during development, change before public launch.

---

## Current UI Architecture

### Landing Page Structure (`app/page.tsx`)

The homepage renders 6 sections in this order:

1. **GENERAL DISCUSSION** (List Layout)
2. **PARTNER COMMUNITIES** (List Layout)
3. **FUNCTIONS (VALUE SYSTEM)** (Grid Layout)
4. **SOCIETY PROTOCOL TECHNICAL SECTION** (List Layout, Locked UI)
5. **OTHERS** (List Layout)
6. **LOCAL** (Community Grid - fetches from Supabase)

### Configuration Source

**Database-driven**: Feeds loaded from `feeds` table in Supabase  
**Service**: `lib/services/feed/get-feeds.ts`  
**Legacy config**: `config/commons-config.ts` (deprecated, not used)

---

## UI Tier Breakdown

### Tier 1: GENERAL DISCUSSION (4 Feeds)

**Layout**: List (table-style with Replies/Views/Last Post columns)  
**Component**: `components/home/forum-category.tsx`  
**Border Color**: Blue  
**Backend Mapping**: Independent Lens Feeds (NOT IMPLEMENTED)

| Feed Title                                                                          | Address  | Description                                                    |
| ----------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| Beginners & Help                                                                    | `feed-1` | New to the forum? Start here with questions and introductions. |
| 4 Key Concepts (Energy, Timeline, state, Actors, accounts, Lifeline, Death, etc...) | `feed-2` | Core concepts and fundamental principles of the system.        |
| Web3 Outpost (Outpod, Badges, Spec)                                                 | `feed-3` | Web3 integration, badges, and technical specifications.        |
| DAO Governance                                                                      | `feed-4` | Decentralized governance discussions and proposals.            |

**Link Pattern**: `/commons/feed-1`, `/commons/feed-2`, etc.  
**Status**: ❌ Routes do not exist

---

### Tier 2: PARTNER COMMUNITIES (4 Feeds)

**Layout**: List  
**Component**: `components/home/forum-category.tsx`  
**Border Color**: Green (but CSS hardcoded to blue)  
**Backend Mapping**: External Lens Group Addresses (NOT IMPLEMENTED)

| Feed Title                 | Address  | Description                                            |
| -------------------------- | -------- | ------------------------------------------------------ |
| General Discussion         | `feed-5` | Discussion about Society Protocol partner communities. |
| Announcements              | `feed-6` | Official partner news and updates.                     |
| Network States Communities | `feed-7` | Discussion about current and upcoming network states.  |
| Partner Badges & SPEC      | `feed-8` | Technical specs and badge systems for partners.        |

**Link Pattern**: `/commons/feed-5`, `/commons/feed-6`, etc.  
**Status**: ❌ Routes do not exist

---

### Tier 3: FUNCTIONS (VALUE SYSTEM) (11 Feeds)

**Layout**: Grid (responsive: 2 cols → 3 cols → 3 cols → 3 cols)  
**Component**: `components/home/function-grid.tsx`  
**Border Color**: Blue  
**Backend Mapping**: System Categories / Tags (NOT IMPLEMENTED)

| Feed Title           | Address   | Description                                    |
| -------------------- | --------- | ---------------------------------------------- |
| Economic Game Theory | `feed-9`  | Economic models and game theory discussions.   |
| Function Ideas       | `feed-10` | Propose and discuss new function concepts.     |
| Hunting              | `feed-11` | Resource discovery and acquisition strategies. |
| Property             | `feed-12` | Property rights and ownership discussions.     |
| Parenting            | `feed-13` | Community growth and mentorship.               |
| Governance           | `feed-14` | Decision-making and governance structures.     |
| Organizations        | `feed-15` | Organizational design and coordination.        |
| Curation             | `feed-16` | Content and quality curation systems.          |
| Farming              | `feed-17` | Value creation and cultivation strategies.     |
| Portal               | `feed-18` | Gateway and integration discussions.           |
| Communication        | `feed-19` | Communication protocols and systems.           |

**Grid Layout**:

- Row 1: 2 cards (50/50)
- Row 2: 3 cards (33/33/33)
- Row 3: 3 cards
- Row 4: 3 cards

**Link Pattern**: `/commons/feed-9`, `/commons/feed-10`, etc.  
**Status**: ❌ Routes do not exist

---

### Tier 4: SOCIETY PROTOCOL TECHNICAL SECTION (4 Feeds)

**Layout**: List  
**Component**: `components/home/forum-category.tsx`  
**Border Color**: Blue  
**Special Styling**: Dark blue background (`bg-[#1a1b4b]`), yellow text, lock icon  
**Backend Mapping**: Token-Gated Lens Feeds (NOT IMPLEMENTED)

| Feed Title                      | Address   | Description                                         |
| ------------------------------- | --------- | --------------------------------------------------- |
| General Architecture Discussion | `feed-20` | High-level system architecture and design patterns. |
| State Machine                   | `feed-21` | State transitions and machine logic discussions.    |
| Consensus (Proof of Hunt)       | `feed-22` | Consensus mechanisms and proof systems.             |
| Cryptography                    | `feed-23` | Cryptographic primitives and security protocols.    |

**Lock Behavior**:

- `isLocked: true` in config
- Shows lock icon in header
- Click triggers alert: "Token Required: You must hold a Society Protocol Pass to enter this research lab"
- Links still point to `/commons/feed-20`, etc. (non-existent)

**Status**: ❌ Routes do not exist, ❌ Token gating not implemented

---

### Tier 5: OTHERS (5 Feeds)

**Layout**: List  
**Component**: `components/home/forum-category.tsx`  
**Border Color**: Blue  
**Backend Mapping**: Independent Lens Feeds (NOT IMPLEMENTED)

| Feed Title              | Address   | Description                                         |
| ----------------------- | --------- | --------------------------------------------------- |
| Meta-discussion         | `feed-24` | Discussion about the Society Protocol Forum itself. |
| Politics & Society      | `feed-25` | Political impacts on society and optimization.      |
| Economics               | `feed-26` | Economic models and theories.                       |
| Cryptocurrencies & Web3 | `feed-27` | The broader crypto and web3 landscape.              |
| Off-topic               | `feed-28` | Anything unrelated to the protocol.                 |

**Link Pattern**: `/commons/feed-24`, `/commons/feed-25`, etc.  
**Status**: ❌ Routes do not exist

---

### Tier 6: LOCAL (Community Grid)

**Layout**: Grid (3 columns)  
**Component**: `components/home/community-grid.tsx`  
**Data Source**: Supabase `communities` table (filtered by `featured = 1`)  
**Backend Mapping**: Lens Group Addresses (IMPLEMENTED)

**Service**: `lib/services/community/get-featured-communities.ts`

**Flow**:

1. Fetch featured communities from Supabase
2. Batch fetch Lens Group data, stats, and admins
3. Adapt to `Community` domain objects
4. Render as cards with image, name, member count, description

**Link Pattern**: `/communities/[lens_group_address]`  
**Status**: ✅ Routes exist, ✅ Backend integration complete

---

## Backend Architecture (What Exists)

### Database Schema (`supabase/setup-schema.sql`)

#### `communities` Table

```sql
- id (UUID)
- lens_group_address (TEXT, UNIQUE)
- name (TEXT)
- feed (TEXT)
- members_count (INTEGER)
- featured (INTEGER) -- 0 or 1
- visible (BOOLEAN)
- created_at, updated_at
```

#### `community_threads` Table

```sql
- id (UUID)
- community_id (UUID, FK to communities)
- lens_feed_address (TEXT)
- author (TEXT)
- root_post_id (TEXT)
- slug (TEXT, UNIQUE)
- title (TEXT)
- summary (TEXT)
- replies_count (INTEGER)
- featured (BOOLEAN)
- visible (BOOLEAN)
- created_at, updated_at
```

### Existing Routes

| Route                               | Purpose          | Status     |
| ----------------------------------- | ---------------- | ---------- |
| `/`                                 | Landing page     | ✅ Working |
| `/communities`                      | Community list   | ✅ Working |
| `/communities/[address]`            | Community detail | ✅ Working |
| `/communities/[address]/new-thread` | Create thread    | ✅ Working |
| `/communities/[address]/edit`       | Edit community   | ✅ Working |
| `/communities/new`                  | Create community | ✅ Working |
| `/thread/[slug]`                    | Thread detail    | ✅ Working |
| `/thread/[slug]/edit`               | Edit thread      | ✅ Working |
| `/reply/[replyId]`                  | Reply detail     | ✅ Working |
| `/u/[username]`                     | User profile     | ✅ Working |
| `/notifications`                    | Notifications    | ✅ Working |
| `/rewards`                          | Rewards page     | ✅ Working |
| `/terms`                            | Terms page       | ✅ Working |

### Missing Routes

| Route                | Purpose          | Status            |
| -------------------- | ---------------- | ----------------- |
| `/commons/[address]` | Feed detail page | ❌ Does not exist |

---

## Component Inventory

### Home Components (`components/home/`)

| Component                  | Purpose                     | Used By          |
| -------------------------- | --------------------------- | ---------------- |
| `forum-category.tsx`       | List layout for feeds       | Tiers 1, 2, 4, 5 |
| `function-grid.tsx`        | Grid layout for feeds       | Tier 3           |
| `community-grid.tsx`       | Grid layout for communities | Tier 6 (LOCAL)   |
| `featured-communities.tsx` | Legacy component            | ❓ Not used      |
| `hero-section.tsx`         | Empty component (49 bytes)  | ❓ Not used      |
| `stats-bar.tsx`            | Stats display               | ❓ Not used      |
| `thread-list-item.tsx`     | Thread list item            | ❓ Not used      |
| `thread-votes-display.tsx` | Vote display                | ❓ Not used      |
| `threads-list.tsx`         | Thread list                 | ❓ Not used      |
| `threads-switcher.tsx`     | Thread switcher             | ❓ Not used      |

### Layout Components (`components/layout/`)

| Component            | Purpose            | Branding           |
| -------------------- | ------------------ | ------------------ |
| `navbar-desktop.tsx` | Desktop navigation | "SOCIETY PROTOCOL" |
| `navbar-mobile.tsx`  | Mobile navigation  | "SOCIETY PROTOCOL" |
| `navbar.tsx`         | Navbar wrapper     | -                  |
| `footer.tsx`         | Footer             | -                  |
| `container.tsx`      | Container wrapper  | -                  |

---

## Authentication Flow (Implemented)

### 3-Step Handshake

1. **Wallet Connection**: `components/auth/login-connect-button.tsx`
   - Uses Wagmi + ConnectKit
   - Detects EOA (Externally Owned Account)

2. **Profile Selection**: `components/auth/login-lens-accounts-dialog.tsx`
   - Fetches Lens accounts owned by wallet
   - User selects which profile to use
   - Supports multi-profile switching

3. **Session Management**: `stores/auth-store.ts`
   - Zustand store with persistence
   - Stores selected account, profile, JWT (if applicable)

---

## Tech Stack

### Frontend

- **Framework**: Next.js 14.2.x (App Router)
- **React**: 18.x
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (56 components in `components/ui/`)
- **Icons**: Lucide React
- **State**: Zustand (auth store)

### Web3

- **Protocol**: Lens Protocol V3
- **Wallet**: Wagmi + ConnectKit + WalletConnect
- **Network**: ZKsync (assumed)

### Backend

- **Database**: Supabase (PostgreSQL)
- **ORM**: Direct SQL queries
- **API**: Lens Protocol V3 GraphQL API

### Editor

- **Library**: Prosekit
- **Features**: Markdown, mentions, images, tables, code blocks
- **Location**: `components/editor/` (19 files)

---

## Critical Gaps (What's Missing)

### 1. `/commons/[address]` Route

**Impact**: All 28 feed links are broken  
**Required Files**:

- `app/commons/[address]/page.tsx`
- Feed detail component
- Feed thread list component
- Thread creation for feeds

### 2. Lens Feed Integration

**Impact**: No backend data for feeds  
**Required**:

- Lens Feed address mapping (replace `feed-1`, `feed-2`, etc.)
- Lens Feed query service
- Feed adapter (transform Lens data to UI objects)
- Shadow indexer for feeds (Supabase caching)

### 3. Token Gating Logic

**Impact**: Technical section is UI-only lock  
**Required**:

- ERC-20/NFT balance check
- Lens Protocol access control integration
- Middleware for protected routes

### 4. Feed Database Schema

**Impact**: No caching for feed content  
**Required**:

- `feeds` table (feed metadata)
- `feed_threads` table (thread cache)
- `feed_replies` table (reply cache)
- Indexer service (listen to Lens events)

---

## Divergence Analysis: codebase.md vs Reality

### What codebase.md Documents (But May Not Exist)

The `codebase.md` file is 911KB and contains a full directory tree + file contents. Based on the directory structure, it documents:

1. **All existing files** (accurate)
2. **Legacy LensForum architecture** (communities-based, not feed-based)
3. **Full component tree** (accurate)
4. **Lib services for communities** (accurate)
5. **Hooks for communities** (accurate)

### What's Outdated in codebase.md

1. **No mention of `config/commons-config.ts`** (new file)
2. **No mention of feed-based architecture** (new paradigm)
3. **Documents community-centric system** (old paradigm)
4. **No mention of 5-tier UI structure** (new design)

### What's Redundant (Candidates for Deletion)

Based on the new feed-based architecture, these community-focused components may be redundant:

#### Home Components (Unused)

- `components/home/featured-communities.tsx` (replaced by `community-grid.tsx`)
- `components/home/hero-section.tsx` (empty, 49 bytes)
- `components/home/stats-bar.tsx` (not used on landing page)
- `components/home/thread-list-item.tsx` (not used on landing page)
- `components/home/thread-votes-display.tsx` (not used on landing page)
- `components/home/threads-list.tsx` (not used on landing page)
- `components/home/threads-switcher.tsx` (not used on landing page)

#### Community Components (May Be Redundant)

If the new architecture is **feed-first** (not community-first), these entire directories may be obsolete:

- `components/communities/` (entire directory - 40+ files)
- `app/communities/` (entire directory - may keep for "LOCAL" section)

**⚠️ WARNING**: Do not delete until confirming the "LOCAL" section is separate from the feed system.

#### Hooks (Community-Specific)

- `hooks/communities/` (13 files - may be needed for LOCAL section)

#### Services (Community-Specific)

- `lib/services/community/` (12 files - may be needed for LOCAL section)

#### Domain (Community-Specific)

- `lib/domain/communities/` (may be needed for LOCAL section)

---

## Recommended Next Steps

### Phase 1: Create Feed Routes (Immediate)

1. Create `app/commons/[address]/page.tsx`
2. Create feed detail component
3. Wire up to Lens Protocol (or mock data)
4. Test all 28 feed links

### Phase 2: Backend Integration (Short-term)

1. Replace placeholder addresses (`feed-1`, etc.) with real Lens Feed addresses
2. Create Lens Feed query service
3. Create feed adapter
4. Add Supabase tables for feed caching

### Phase 3: Token Gating (Medium-term)

1. Implement ERC-20/NFT balance check
2. Add middleware for protected routes
3. Integrate with Lens Protocol access control
4. Test Technical Section lock

### Phase 4: Cleanup (Long-term)

1. Audit unused components
2. Remove redundant community code (if feed-first architecture is confirmed)
3. Update codebase.md to reflect new architecture
4. Consolidate documentation

---

## File Locations Reference

### Critical Files

- **Landing Page**: `app/page.tsx`
- **Feed Config**: `config/commons-config.ts`
- **List Layout**: `components/home/forum-category.tsx`
- **Grid Layout**: `components/home/function-grid.tsx`
- **Community Grid**: `components/home/community-grid.tsx`
- **Navbar**: `components/layout/navbar-desktop.tsx`
- **Auth Store**: `stores/auth-store.ts`
- **Database Schema**: `supabase/setup-schema.sql`

### Missing Files

- **Feed Route**: `app/commons/[address]/page.tsx` ❌
- **Feed Service**: `lib/services/feed/` ❌
- **Feed Adapter**: `lib/adapters/feed-adapter.ts` ❌
- **Feed Schema**: `supabase/migrations/*_add_feeds_table.sql` ❌

---

## Conclusion

The UI is **100% complete** with a beautiful 5-tier structure. The backend integration is **0% complete** for the feed system. The existing community system (LOCAL section) is fully functional and should be preserved.

**Priority**: Implement `/commons/[address]` route and connect to Lens Protocol feeds.

---

**Document Status**: ✅ Accurate as of 2026-02-26  
**Next Review**: After Phase 1 completion

---

## 📊 Architecture Overview

### Data Flow

```
User Request
    ↓
Next.js Page (Server Component)
    ↓
Service Layer (lib/services/feed/)
    ↓
Lens Protocol API (Blockchain)
    ↓
Adapter Layer (lib/adapters/)
    ↓
UI Components
    ↓
User sees content
```

### Write Flow

```
User submits form
    ↓
Client Component (Hook)
    ↓
Lens Protocol SDK (Direct)
    ├─ Upload to IPFS/Grove
    ├─ Sign transaction
    ├─ Write to blockchain
    └─ Wait for confirmation
    ↓
Server Action (Database cache)
    ↓
Revalidate paths
    ↓
User sees update
```

---

## 🚀 Deployment Checklist: Rebranding

### Before Launch - Update App Identity

**Location**: `lib/shared/constants.ts`

#### Free Changes (No Cost)

```typescript
// 1. Change app name
export const APP_NAME = "YourAppName";

// 2. Change URLs
const MAINNET_APP_URL = "https://yourapp.com";
const TESTNET_APP_URL = "http://localhost:3000";

// 3. Change thread prefix (lib/domain/threads/content.ts)
export const THREAD_CONTENT_PREFIX = "YourApp Thread: ";
```

#### Optional: Register Your Own Lens App (~$1-5 gas)

```typescript
// After registering on Lens Protocol:
const MAINNET_APP_ADDRESS: Address = "0xYOUR_APP_ADDRESS";
const TESTNET_APP_ADDRESS: Address = "0xYOUR_TESTNET_ADDRESS";
```

**Impact**: New posts show under your app name (old posts keep "LensForum")

**Recommendation**: Keep LensForum config during development, change before public launch.

---

## 📝 Known Limitations

- 5 feeds have placeholder addresses (feed-20, 21, 22, 23, 26)
- Page reload after reply creation
- No loading skeletons
- Manual "Load More" button

---

## 🎯 Production Status

**Core Features**: ✅ Complete  
**Blockchain Integration**: ✅ Working  
**Database**: ✅ Operational  
**Authentication**: ✅ Working  
**Ready for**: User testing and beta launch 🚀

---

**Document Status**: ✅ Accurate as of 2026-03-01  
**Next Review**: After production deployment

---

## 🚀 VPS Deployment Log

**Deployed**: 2026-03-03  
**Server**: `srv1133784` — Ubuntu 24.04, IP: `72.61.119.100`  
**Domain**: `forum.societyprotocol.io`  
**App Path**: `/var/www/Web3Forum`

---

### Step 1: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # v20.20.0
npm -v    # 10.8.2
```

---

### Step 2: Install Dependencies

```bash
cd /var/www/Web3Forum
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` required due to `react-day-picker@8.10.1` / `date-fns@2.3.0` peer conflict.

---

### Step 3: Build

```bash
npm run build
```

Build output confirmed all routes compiled successfully.

---

### Step 4: Install and Configure PM2

```bash
npm install -g pm2
pm2 start npm --name "web3forum" -- start
pm2 save
pm2 startup
```

PM2 configured to auto-start on reboot via systemd (`pm2-root.service`).

---

### Step 5: Install and Configure Nginx

```bash
apt install -y nginx

cat > /etc/nginx/sites-available/web3forum << 'EOF'
server {
    server_name forum.societyprotocol.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/web3forum /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

### Step 6: SSL with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d forum.societyprotocol.io
```

Certbot automatically updated the Nginx config with HTTPS and set up auto-renewal.

---

### Environment File

`.env` (or `.env.local`) at `/var/www/Web3Forum/` contains:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

> Keys are server-side only — no `NEXT_PUBLIC_` prefix.

---

**Live at**: https://forum.societyprotocol.io ✅
