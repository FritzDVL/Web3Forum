import { readFileSync } from "fs";
import { resolve } from "path";
import { PublicClient, mainnet, evmAddress } from "@lens-protocol/client";
import { addAppFeeds } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { lens } from "viem/chains";

// --- Load .env.local ---
const envPath = resolve(process.cwd(), ".env.local");
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
}

// --- Config ---
const APP = "0x637E685eF29403831dE51A58Bc8230b88549745E";

const FEEDS = [
  "0x3BF4Eb9725232130F5dA804cD16bBdb61171cf28",
  "0xDfe0F7fdf80Df515D396470e6bB1d8f398ddF25F",
  "0x7c86a0FCE84528cB90faF8394D3439cDCd48a69a",
  "0x70d9e6D753717353c814C77aa8a860C0A3c0c256",
  "0x4c99061F02d9bAB31cE2B6a8646642173e36e3D4",
  "0x0115dB8888d2DB261752302c9B3F6706e5dcABc9",
  "0x44C171f2ADc2b12F3dB124abC21fe53731072DC7",
  "0x1837523A5921968cF9113B541d621BfFa0c9fb2E",
  "0x21B212Ed66CeD5479396315ef788b97b071d891A",
  "0xF9B6D91018E364D1F805488f46C03cfFaD0820d6",
  "0x51336141C44838c5657EAA3004dE8f92E23597C1",
  "0xd5487eA18e9049e1977EA6Ef2dba890B1Bf511a5",
  "0xd380F727681091B11080dA6244A79f928408F37C",
  "0x69c64cC29f6845Ab0bFD113E73a3b5cA4288DE4d",
  "0x8b83c64265b71A3745A744E83F39Ee8D353496f0",
  "0x9929116d505EAC9788A9CD66764d347f135479FE",
  "0xd6555f772f4307c200dedAb0549900dA7E244C82",
  "0x408dab722a3774215a43BF9dc66d8A3524B0Aff9",
  "0xb7140FB035cD96AA44F2273C65F02d4bAACE2f48",
  "0xeDa10585df116b9F8D854B8fb05A933c9daAFB8C",
  "0xB4949Ffb24C1Ea6b26442F3b6962CD697E1d0561",
  "0x2aBFcf84cc82C4A3bBF0493Ab5468992812fC90c",
  "0x8c23479Fb235630C5B32cE6a6308d922d4ab6ca4",
  "0x9Bc308a2722Dce24Fe3F86bC095b41D417BB83cD",
  "0xd564Aaf85158c3D494f7efA2f7F3aD85f5BBBf01",
  "0x0E3e5206B0dF562F460CcF37D9Cb359704C6eB08",
];

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    console.error("PRIVATE_KEY not found in .env.local");
    process.exit(1);
  }

  console.log("Authenticating as Builder...");

  // Create wallet
  const account = privateKeyToAccount(pk as `0x${string}`);
  const wallet = createWalletClient({ account, chain: lens, transport: http() });

  // Create Lens client and authenticate as Builder
  const client = PublicClient.create({ environment: mainnet, origin: "https://web3forum.xyz/" });

  const challenge = await client.challenge({ builder: { address: account.address } });
  if (challenge.isErr()) {
    console.error("Challenge failed:", challenge.error);
    process.exit(1);
  }

  const signature = await account.signMessage({ message: challenge.value.text });
  const auth = await client.authenticate({ id: challenge.value.id, signature });
  if (auth.isErr()) {
    console.error("Auth failed:", auth.error);
    process.exit(1);
  }

  const sessionClient = auth.value;
  console.log(`Authenticated. Adding ${FEEDS.length} feeds to App ${APP}...`);

  const result = await addAppFeeds(sessionClient, {
    feeds: FEEDS.map((f) => evmAddress(f)),
    app: evmAddress(APP),
  }).andThen(handleOperationWith(wallet));

  if (result.isErr()) {
    console.error("Failed:", result.error);
    process.exit(1);
  }

  console.log(`Done! ${FEEDS.length} feeds registered.`);
}

main();
