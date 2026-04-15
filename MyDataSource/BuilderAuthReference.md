# Builder Auth & Authorization Endpoint — Complete Reference

## Source: fountain-ink/auth (MIT licensed)
## Repo: https://github.com/fountain-ink/auth

This document explains how the Lens Authorization Endpoint and App Verification
work, using fountain.ink's open-source implementation as a working reference.

---

## What Is "Builder" Authentication?

Builder auth is a special authentication mode in the Lens Protocol. Instead of
logging in as a regular user (accountOwner/accountManager), you authenticate as
the **builder/owner of a Lens App**. This gives you admin-level powers:

- Register/remove Authorization Endpoints
- Add/remove App Signers
- Add/remove App Feeds
- Add/remove App Groups
- Update App Metadata
- Manage Sponsorship settings

Your codebase already uses Builder auth in `admin-session.ts`:

```ts
const challengeRequest: ChallengeRequest = {
  builder: {
    address: adminSigner.address,
  },
};
```

The key requirement: the wallet address used for Builder auth must be the
**owner** of the Lens App contract (or an admin added to it).

### Why You Might Not Have Been Able to Use It

Common reasons:
1. The wallet in PRIVATE_KEY might not be the owner of the App contract
2. The Lens Developer Dashboard might not expose all Builder features in the UI
3. Some features (like addAppAuthorizationEndpoint) are SDK/GraphQL-only — no
   dashboard UI exists for them yet

The SDK actions that require Builder auth:
- `addAppAuthorizationEndpoint` / `removeAppAuthorizationEndpoint`
- `addAppSigners` / `removeAppSigners`
- `addAppFeeds` / `removeAppFeeds`
- `setDefaultAppFeed`
- `addAppGroups` / `removeAppGroups`
- `setAppMetadata`

All of these are called programmatically via scripts, not through a web UI.

---

## The Two Endpoints Explained

### 1. Authorization Endpoint (`/authorize`)

Called by the Lens API every time a user tries to log in to your app.

Flow:
```
User clicks "Login" in your app
  → Frontend calls Lens API to authenticate
  → Lens API POSTs to YOUR /authorize endpoint:
    { "account": "0x...", "signedBy": "0x..." }
  → Your server responds:
    { "allowed": true, "sponsored": true, "signingKey": "0xPrivateKey..." }
  → Lens API grants or denies credentials
```

The `signingKey` in the response is the private key of your App Signer.
This enables App Verification (see below).

### 2. Verification Endpoint (`/verify`)

Called by the Lens API every time a user performs an operation (post, comment,
follow, etc.) through your app.

Flow:
```
User creates a post in your app
  → Frontend sends post request to Lens API
  → Lens API POSTs to YOUR /verify endpoint:
    { "nonce": "42", "deadline": "...", "operation": "Post",
      "validator": "0x...", "account": "0x..." }
  → Your server signs the operation with the App Signer key
  → Returns: { "allowed": true, "signature": "0x..." }
  → Lens Protocol validates the signature onchain
  → Post is created (or rejected if signature is invalid)
```

This prevents anyone from impersonating your app. Even if someone knows your
app address, they can't create posts "as your app" without the signature.

---

## Fountain.ink's Implementation (Complete Source)

### File: src/config.ts
```ts
import never from 'never';
import { chains } from '@lens-chain/sdk/viem';

export const PORT = process.env.PORT || 3004;
export const API_SECRET = process.env.API_SECRET ?? never('API_SECRET required');
export const PRIVATE_KEY = process.env.PRIVATE_KEY ?? never('PRIVATE_KEY required');
export const ENVIRONMENT = process.env.ENVIRONMENT ?? never('ENVIRONMENT required');
export const APP_ADDRESS = ENVIRONMENT.toLowerCase() === 'production'
  ? process.env.APP_ADDRESS
  : process.env.APP_ADDRESS_TESTNET ?? never('APP_ADDRESS required');
export const CHAIN = ENVIRONMENT.toLowerCase() === 'production'
  ? chains.mainnet : chains.testnet;
```

### File: src/approver.ts
```ts
import { privateKeyToAccount } from 'viem/accounts';
import { evmAddress } from '@lens-protocol/client';
import { OperationApprovalSigner } from '@lens-protocol/client/viem';
import { APP_ADDRESS, CHAIN, PRIVATE_KEY } from './config';

export const approver = new OperationApprovalSigner({
  chain: CHAIN,
  app: evmAddress(APP_ADDRESS),
  signer: privateKeyToAccount(PRIVATE_KEY as `0x${string}`),
});
```

### File: src/authorize.ts
```ts
import express from 'express';
import { PRIVATE_KEY } from './config';

const router = express.Router();

router.post('/', function (req, res) {
  // Lens Developer Dashboard sends test requests
  if (req.body.test === true) {
    return res.sendStatus(200);
  }

  const { account, signedBy } = req.body;
  if (!account || !signedBy) {
    return res.status(400).json({ error: "Missing 'account' or 'signedBy'" });
  }

  // YOUR LOGIC HERE: check allowlist, group membership, etc.
  const isAllowed = true;

  if (!isAllowed) {
    return res.json({ allowed: false, reason: 'User not allowed' });
  }

  res.json({
    allowed: true,
    sponsored: true,
    signingKey: PRIVATE_KEY, // enables App Verification
  });
});

export default router;
```

### File: src/verify.ts
```ts
import express from 'express';
import { approver } from './approver';
import { evmAddress, OperationType } from '@lens-protocol/client';

const router = express.Router();

router.post('/', async function (req, res) {
  // Validate required fields...

  // YOUR LOGIC HERE: decide if this operation is allowed
  const isAllowed = true;

  if (!isAllowed) {
    return res.json({ allowed: false, reason: 'Operation not allowed.' });
  }

  // Sign the operation
  const signature = await approver.signOperationApproval({
    nonce: req.body.nonce,
    deadline: req.body.deadline,
    operation: req.body.operation,
    validator: evmAddress(req.body.validator),
    account: evmAddress(req.body.account),
  });

  res.json({ allowed: true, signature });
});

export default router;
```

### File: src/index.ts (Express server with Bearer token auth)
```ts
import express from 'express';
import cors from 'cors';
import { PORT, API_SECRET } from './config';
import authorizationRoute from './authorize';
import verificationRoute from './verify';

const app = express();
app.use(cors({ /* config */ }));
app.use(express.json());

// Bearer token middleware — Lens API authenticates with your secret
app.use((req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ") || authHeader.split(" ")[1] !== API_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.use('/authorize', authorizationRoute);
app.use('/verify', verificationRoute);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### File: src/keygen.ts (Generate keys)
```ts
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { toBytes, keccak256 } from 'viem/utils';

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('Approver Private Key:', privateKey);
console.log('Approver Address:', account.address);

const secret = keccak256(toBytes(privateKey));
console.log('API Secret:', secret);
```

---

## Setup Steps (For Web3Forum)

### Step 1: Generate Keys
Run fountain.ink's keygen or equivalent:
```bash
bun src/keygen.ts
```
This gives you:
- PRIVATE_KEY (the App Signer private key)
- Approver Address (register this as App Signer)
- API_SECRET (shared between your server and Lens API)

### Step 2: Deploy Auth Server
Either:
- A) Standalone Express server (like fountain.ink does)
- B) Next.js API route in your existing app (simpler for you)

### Step 3: Register with Lens (Builder auth script)
```ts
import { addAppAuthorizationEndpoint, addAppSigners } from '@lens-protocol/client/actions';

// 1. Register the authorization endpoint
await addAppAuthorizationEndpoint(sessionClient, {
  endpoint: uri("https://lensforum.xyz/api/lens-auth"),
  app: evmAddress(APP_ADDRESS),
  bearerToken: API_SECRET,
});

// 2. Register the signer address
await addAppSigners(sessionClient, {
  app: evmAddress(APP_ADDRESS),
  signers: [evmAddress(SIGNER_ADDRESS)],
}).andThen(handleOperationWith(wallet)).andThen(sessionClient.waitForTransaction);
```

### Step 4: Done
Now every login goes through your endpoint, and every operation is signed.
