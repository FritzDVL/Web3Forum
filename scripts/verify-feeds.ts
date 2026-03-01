import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function verifyFeedAddresses() {
  console.log("🔍 Checking all feed addresses...\n");

  const { data: feeds, error } = await supabase
    .from("feeds")
    .select("category, title, lens_feed_address, display_order")
    .order("category")
    .order("display_order");

  if (error) {
    console.error("❌ Error fetching feeds:", error);
    return;
  }

  if (!feeds || feeds.length === 0) {
    console.log("⚠️  No feeds found in database");
    return;
  }

  let validCount = 0;
  let placeholderCount = 0;
  const placeholders: any[] = [];

  console.log("📋 All Feeds:\n");
  
  let currentCategory = "";
  feeds.forEach((feed) => {
    if (feed.category !== currentCategory) {
      currentCategory = feed.category;
      console.log(`\n${currentCategory.toUpperCase()}:`);
    }

    const isPlaceholder = feed.lens_feed_address.startsWith("feed-");
    const isValid = feed.lens_feed_address.startsWith("0x");
    
    const status = isValid ? "✅" : isPlaceholder ? "❌" : "⚠️";
    
    console.log(`  ${status} ${feed.title}`);
    console.log(`     Address: ${feed.lens_feed_address}`);

    if (isValid) validCount++;
    if (isPlaceholder) {
      placeholderCount++;
      placeholders.push(feed);
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Total Feeds: ${feeds.length}`);
  console.log(`   ✅ Valid Addresses: ${validCount}`);
  console.log(`   ❌ Placeholder Addresses: ${placeholderCount}`);

  if (placeholderCount > 0) {
    console.log(`\n⚠️  Feeds still needing real addresses:`);
    placeholders.forEach((feed) => {
      console.log(`   - ${feed.title} (${feed.lens_feed_address})`);
    });
  } else {
    console.log(`\n🎉 All feeds have valid addresses!`);
  }
}

verifyFeedAddresses();
