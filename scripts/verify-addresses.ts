/**
 * Verify all Lens Protocol addresses configured in constants.ts
 * Run: npx tsx scripts/verify-addresses.ts
 */

import { PublicClient, mainnet, evmAddress } from "@lens-protocol/client";
import { fetchGroup, fetchFeed, fetchAccount } from "@lens-protocol/client/actions";

const client = PublicClient.create({
  environment: mainnet,
  origin: "https://lensforum.xyz/",
});

// ── Addresses from constants.ts ──────────────────────────────
const ADDRESSES = {
  APP_ADDRESS: "0x637E685eF29403831dE51A58Bc8230b88549745E",
  ADMIN_USER_ADDRESS: "0xc93947ed78d87bdeb232d9c29c07fd0e8cf0a43e",
  COMMONS_GROUP: "0x724CCb155b813b8a21E7C452167d22828871c7E1",
  COMMONS_FEED: "0x7d0aA1975693926708327d665Af10C0c68Ecb096",
  RESEARCH_GROUP: "0x7f2b18933152DF1c6ded211583c95A739831743d",
  RESEARCH_FEED: "0xB9feACdd4A9f575b71D15152fd17B0902F454fDA",
  BAN_MEMBER_RULE: "0xe12543e5f917adA5aeF92B26Bc08E1925ec9F53F",
};

// ── Helpers ──────────────────────────────────────────────────

function ok(label: string, detail?: string) {
  console.log(`  ✅ ${label}${detail ? ` — ${detail}` : ""}`);
}
function fail(label: string, detail?: string) {
  console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
}

// ── Tests ────────────────────────────────────────────────────

async function verifyGroup(label: string, address: string) {
  try {
    const result = await fetchGroup(client, { group: evmAddress(address) });
    if (result.isErr() || !result.value) {
      fail(label, `not found on Lens (${address})`);
      return false;
    }
    const g = result.value;
    const name = g.metadata?.name || "(no name)";
    ok(label, `"${name}" — address: ${address}`);
    return true;
  } catch (e: any) {
    fail(label, e.message);
    return false;
  }
}

async function verifyFeed(label: string, address: string) {
  try {
    const result = await fetchFeed(client, { feed: evmAddress(address) });
    if (result.isErr() || !result.value) {
      fail(label, `not found on Lens (${address})`);
      return false;
    }
    const f = result.value;
    const name = f.metadata?.name || "(no name)";
    const posts = f.stats?.posts ?? "?";
    ok(label, `"${name}" — ${posts} posts — address: ${address}`);
    return true;
  } catch (e: any) {
    fail(label, e.message);
    return false;
  }
}

async function verifyAccount(label: string, address: string) {
  try {
    const result = await fetchAccount(client, { address: evmAddress(address) });
    if (result.isErr() || !result.value) {
      fail(label, `no Lens account found for ${address}`);
      return false;
    }
    const a = result.value;
    const username = a.username?.localName || "(no username)";
    ok(label, `@${username} — address: ${address}`);
    return true;
  } catch (e: any) {
    fail(label, e.message);
    return false;
  }
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("\n🔍 Verifying Lens Protocol addresses...\n");

  let passed = 0;
  let total = 0;

  console.log("── Groups ──");
  total += 2;
  if (await verifyGroup("Commons Group", ADDRESSES.COMMONS_GROUP)) passed++;
  if (await verifyGroup("Research Group", ADDRESSES.RESEARCH_GROUP)) passed++;

  console.log("\n── Feeds ──");
  total += 2;
  if (await verifyFeed("Commons Feed", ADDRESSES.COMMONS_FEED)) passed++;
  if (await verifyFeed("Research Feed", ADDRESSES.RESEARCH_FEED)) passed++;

  console.log("\n── Accounts ──");
  total += 1;
  if (await verifyAccount("Admin User", ADDRESSES.ADMIN_USER_ADDRESS)) passed++;

  console.log(`\n── Result: ${passed}/${total} passed ──\n`);

  if (passed < total) {
    console.log("⚠️  Some addresses failed verification. Check the output above.");
    process.exit(1);
  } else {
    console.log("✅ All addresses verified successfully. Ready for Phase 2.");
  }
}

main().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
