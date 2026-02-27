# Quick Start Guide - Feeds Migration

## ✅ Files Created (Completed)

1. ✅ `app/commons/[address]/page.tsx` - Feed placeholder page
2. ✅ `supabase/migrations/20260227_create_feeds_tables.sql` - Schema
3. ✅ `supabase/migrations/20260227_seed_feeds_data.sql` - 28 feeds data
4. ✅ `scripts/run-feeds-migration.sh` - Migration guide

---

## 🚀 Next: Run Migrations in Supabase

### Step 1: Create Tables (2 minutes)

1. Open: https://supabase.com/dashboard/project/vgdtmesimhrtqrpstsgm/sql/new

2. Copy entire contents of:
   ```
   supabase/migrations/20260227_create_feeds_tables.sql
   ```

3. Paste into SQL Editor and click **"Run"**

4. You should see: "Success. No rows returned"

### Step 2: Insert Seed Data (1 minute)

1. In same SQL Editor, click **"New query"**

2. Copy entire contents of:
   ```
   supabase/migrations/20260227_seed_feeds_data.sql
   ```

3. Paste and click **"Run"**

4. You should see: "Success. No rows returned"

### Step 3: Verify Data (30 seconds)

Run this query in SQL Editor:
```sql
SELECT category, COUNT(*) as count 
FROM feeds 
GROUP BY category 
ORDER BY category;
```

Expected result:
```
functions  | 11
general    | 4
others     | 5
partners   | 4
technical  | 4
```

Total: 28 feeds ✅

---

## 🧪 Test in Browser

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Open: http://localhost:3000

3. Click any feed link (e.g., "Beginners & Help")

4. Should see placeholder page with:
   - Feed address in heading
   - "Under construction" message
   - Blue info box

5. Try other feeds to confirm all 28 work

---

## 🎯 Success Indicators

✅ No 404 errors when clicking feed links  
✅ Placeholder page displays correctly  
✅ Dark mode works on feed pages  
✅ 28 rows in `feeds` table  
✅ 0 rows in `feed_posts` table (ready for data)

---

## 🐛 Troubleshooting

**Issue**: 404 error still appears
- **Fix**: Restart Next.js dev server (`npm run dev`)

**Issue**: SQL error "relation already exists"
- **Fix**: Tables already created, skip to Step 2

**Issue**: SQL error "duplicate key value"
- **Fix**: Seed data already inserted, you're done!

---

## 📝 What's Next?

After migrations are complete, you can:

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: Add feeds system foundation (Option B + Phase 1)"
   ```

2. **Start Phase 2**: Implement Lens Protocol integration
3. **Start Phase 3**: Build service layer
4. **Start Phase 4**: Add real feed content display

---

**Estimated Time**: 5 minutes total  
**Difficulty**: Easy (copy/paste SQL)  
**Impact**: Fixes all 28 broken feed links! 🎉
