# 🔧 Troubleshooting: No Data Showing in App

## Problem: You have data in Supabase but the app shows "No data"

This is almost always a **Row Level Security (RLS)** issue.

---

## ✅ Quick Fix (Run This First!)

### Step 1: Run the RLS Fix Script

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy contents of `supabase/fix-all-rls-policies.sql`
3. Paste and click **Run**

This will:
- ✅ Fix RLS policies for `cars` table
- ✅ Fix RLS policies for `contracts` table
- ✅ Fix RLS policies for `damage_points` table
- ✅ Fix RLS policies for `users` table

### Step 2: Verify Data Access

The script includes test queries at the end. You should see:
```
cars_count: 29
contracts_count: 8
damages_count: 16
```

### Step 3: Refresh Your App

- Pull down to refresh on any page
- Or reload the browser (F5)
- Data should now appear!

---

## 🔍 Detailed Diagnosis

### Check 1: Are you logged in?

RLS policies require authentication. Make sure you're signed in to the app.

```sql
-- Run in Supabase SQL Editor
SELECT auth.uid();
-- Should return your user ID, not NULL
```

### Check 2: Does data exist?

```sql
-- Check if data exists
SELECT 
  (SELECT COUNT(*) FROM public.cars) as cars,
  (SELECT COUNT(*) FROM public.contracts) as contracts,
  (SELECT COUNT(*) FROM public.damage_points) as damages;
```

### Check 3: Can you access the data?

```sql
-- Try to select directly (as authenticated user)
SELECT * FROM public.damage_points LIMIT 1;
```

**If this returns an error** like "permission denied" or "row level security policy", then RLS is blocking you.

### Check 4: What are the current policies?

```sql
-- View all RLS policies
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cars', 'contracts', 'damage_points')
ORDER BY tablename, policyname;
```

---

## 🚨 Common Issues

### Issue 1: "No policies exist"

**Symptom:** Query returns 0 rows

**Solution:** Run `supabase/fix-all-rls-policies.sql`

### Issue 2: "Policies are too restrictive"

**Symptom:** Policies exist but data still not showing

**Problem:** Policies might be checking for specific user ownership

**Solution:** The fix script creates policies that allow ALL authenticated users to view data

### Issue 3: "Not authenticated"

**Symptom:** `SELECT auth.uid()` returns NULL

**Solution:** 
1. Sign out of the app
2. Sign in again
3. Check if token is being sent with requests

### Issue 4: "Wrong Supabase project"

**Symptom:** Data exists in one project but app connects to another

**Solution:** Check your `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🎯 The Fix Script Does This:

### For `damage_points` table:

```sql
-- Allows ALL authenticated users to view ALL damage points
CREATE POLICY "Authenticated users can view all damage points"
  ON public.damage_points
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

This means:
- ✅ Any logged-in user can see all damages
- ✅ No ownership checks
- ✅ Works for the damage-report page

### For `contracts` table:

```sql
-- Allows ALL authenticated users to view ALL contracts
CREATE POLICY "Authenticated users can view all contracts"
  ON public.contracts
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

### For `cars` table:

```sql
-- Allows ALL authenticated users to view ALL cars
CREATE POLICY "Authenticated users can view all cars"
  ON public.cars
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

## 🧪 Test After Fix

### In Supabase SQL Editor:

```sql
-- This should return 16 rows
SELECT 
  dp.id,
  dp.description,
  dp.severity,
  dp.view_side,
  c.renter_full_name,
  c.car_license_plate
FROM public.damage_points dp
JOIN public.contracts c ON dp.contract_id = c.id
ORDER BY dp.created_at DESC;
```

### In Your App:

1. Open browser console (F12)
2. Go to `/damage-report` page
3. Look for console logs:
   ```
   Loading damages from Supabase...
   Damages query result: { data: [...], error: null }
   Loaded 16 damages successfully
   ```

If you see `error: { message: "..." }`, that's your clue!

---

## 🔐 Security Note

The policies we're creating allow all authenticated users to view all data. This is appropriate for a car rental management app where staff need to see all contracts and damages.

If you need more restrictive policies later (e.g., users can only see their own contracts), you can modify the policies:

```sql
-- Example: Users can only see their own contracts
CREATE POLICY "Users can view own contracts"
  ON public.contracts
  FOR SELECT
  USING (auth.uid() = user_id);
```

But for now, we want ALL authenticated users to see ALL data.

---

## ✅ Success Checklist

After running the fix script, you should have:

- ✅ 4 policies on `damage_points` table (SELECT, INSERT, UPDATE, DELETE)
- ✅ 4 policies on `contracts` table (SELECT, INSERT, UPDATE, DELETE)
- ✅ 1 policy on `cars` table (SELECT)
- ✅ 3 policies on `users` table (SELECT, INSERT, UPDATE)

And in your app:

- ✅ Damage Report page shows 16 damages
- ✅ Contracts page shows 8 contracts
- ✅ Cars page shows 29 cars
- ✅ Car details page shows contracts and damages
- ✅ No "permission denied" errors in console

---

## 🆘 Still Not Working?

1. **Check browser console** for exact error message
2. **Check Supabase logs** (Dashboard → Logs)
3. **Verify you're signed in** (check if user icon shows in app)
4. **Try signing out and back in**
5. **Clear browser cache** and reload
6. **Check network tab** to see if API calls are being made

The console logs I added will tell you exactly what's wrong!

---

## 📞 Error Messages Explained

| Error Message | Cause | Fix |
|--------------|-------|-----|
| "new row violates row-level security policy" | RLS blocking INSERT | Run fix script |
| "permission denied for table" | RLS blocking SELECT | Run fix script |
| "No damages found in database" | No data OR RLS blocking | Check if data exists |
| "Could not fetch user AADE settings" | User not in users table | Sign up first |
| "supabaseUrl is required" | Missing .env file | Create .env with credentials |

---

**TL;DR:** Run `supabase/fix-all-rls-policies.sql` in Supabase SQL Editor, then refresh your app! 🎉

