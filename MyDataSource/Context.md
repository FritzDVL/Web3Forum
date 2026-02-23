This is a significant data dump, but the architecture here is actually quite elegant. You’re building a decentralized "Discourse" that balances the "Source of Truth" (Lens V3) with a high-performance "Read Layer" (Supabase).

I’ve synthesized your notes into a clean, structured **Project Manifesto & Technical Specification**. This structure moves from the "High-Level Vision" down to the "Gritty Implementation" details.

---

# Society Protocol Forum: Master Specification

## 1. The 3-Tier Architecture

The forum is organized into three distinct "Tiers" to balance global discovery with regional and technical sovereignty.

| Tier | Name | Governance Logic | Visibility & Access |
| --- | --- | --- | --- |
| **Tier 1** | **Public Commons** | One Lens Group / Many Feeds | Public; Open Join; Unified Indexing |
| **Tier 2** | **Technical Vault** | Isolated Lens Group | Gated (Token NFT); Client-side Encryption |
| **Tier 3** | **Local Embassies** | Regional Lens Groups | Sovereign; Language-based Routing |

---

## 2. Technical Mapping (The "Plumbing")

This table maps how a user action in the UI translates to blockchain primitives and database entries.

### **Core Primitive Mapping**

| UI Component | Business Logic | Lens V3 Primitive | Supabase Entity |
| --- | --- | --- | --- |
| **Root Category** | Unit of Governance | **Lens Group** | `root_categories` |
| **Sub-Category** | Segmented Stream | **Lens Feed** | `sub_categories` |
| **Topic / Thread** | Main Discussion | **Article Publication** | `threads` |
| **Reply / Post** | Engagement | **Comment Publication** | `replies` |
| **User Profile** | Identity | **Lens Account** | `profiles_cache` |

---

## 3. Engineering Guardrails

Based on previous project "scar tissue," these rules are non-negotiable for stability.

### **The "Goldilocks" Stack**

* **Framework**: Next.js 14.2.x & React 18 (Avoid Next 15/React 19 due to Web3 library incompatibilities).
* **Transpilation**: Must include `connectkit` and `walletconnect` in `transpilePackages` in `next.config.mjs`.
* **Polyfills**: Manually disable Node.js modules (`fs`, `net`, `tls`) in Webpack to prevent browser crashes.

### **The 3-Step Handshake (Identity Flow)**

1. **Wallet Connected**: EOA is detected via Wagmi/ConnectKit.
2. **Profile Selected**: User chooses which Lens Profile they want to act as.
3. **Session Active**: A JWT is generated and stored in a **Zustand AuthStore** with persistence.

---

## 4. Shadow Indexing Strategy

To ensure the UI is "instant," we use Supabase as a cache.

* **The Metadata Prefix**: Every Lens post is prefixed with `LearningLens: [Tier]`. This allows the indexer to verify the post belongs to the forum.
* **The Fallback Rule**: If a post is missing from Supabase, the UI must fetch directly from the Lens API to ensure 100% data availability.
* **Flat Replies**: Avoid deep-nested UI bugs. Use a chronological list with "In reply to" badges (quotes) using Markdown references.

---

## 5. Implementation Roadmap

### **Phase 1: Foundations**

* Deploy `SOCIETY_COMMONS_GROUP` and `SOCIETY_VAULT_GROUP` on ZKsync.
* Initialize 15-20 static Lens Feeds for Tier 1.
* Setup `lib/adapters/forum-adapter.ts` to transform raw Lens data into clean UI objects.

### **Phase 2: Authentication**

* Build the **ConnectMonitor** (headless state sync).
* Implement the **Account Picker Dialog** for multi-profile users.

### **Phase 3: The Content Loop**

* Build the **Thread Composer** with Markdown support.
* Deploy **Supabase Edge Functions** to listen for `PostCreated` events.
* Implement the **Vault Service** (Lit Protocol) for decryption.

---

### **Next Step Recommendation**

This organized view clarifies that your **AuthStore** and **Data Adapters** are the most critical "first-build" items.

**Would you like me to generate the boilerplate code for the `forum-adapter.ts` so we can start insulating your UI from the raw Lens SDK?**