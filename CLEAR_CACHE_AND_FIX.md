# 🔧 Clear Cache and Fix 406 Error

## The Issue
You're still seeing the old code with `select=*` because of caching. The code has been updated but your browser/bundler is using cached versions.

## ✅ Solution: Clear ALL Caches

### Method 1: Full Clean (Recommended)

**Stop your development server**, then run these commands:

```bash
# 1. Clear Metro bundler cache
npx expo start --clear

# 2. Or if that doesn't work, manually clear everything:
rm -rf node_modules/.cache
rm -rf .expo
npm cache clean --force

# 3. Then restart
npx expo start
```

### Method 2: Browser Cache (If using web)

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**
4. Or go to Application → Clear Storage → Clear All

### Method 3: Full Reset (Nuclear option)

```bash
# Stop the server, then:
rm -rf node_modules
rm -rf .expo
rm -rf node_modules/.cache
npm install
npx expo start --clear
```

---

## 🔍 What I Fixed (Already Done)

### 1. ✅ Updated `services/auth.service.ts`
- Removed ALL columns that don't exist in your database
- Now only queries these exact columns:
  ```
  id, name, signature_url, aade_enabled, aade_user_id,
  aade_subscription_key, company_vat_number, company_name,
  company_address, company_activity, created_at, updated_at
  ```

### 2. ✅ Updated `utils/supabase.ts`
- Added explicit Accept and Content-Type headers
- Should help with 406 errors

### 3. ✅ Updated `app/profile.tsx`
- Better error handling
- Friendly messages for missing columns

### 4. ✅ Updated `components/app-header.tsx`
- Loads real user data
- Modern icons
- All menu items work

---

## 🎯 After Clearing Cache

Once you restart with `--clear`, you should see:

1. ✅ **No more 406 errors**
2. ✅ **Profile page loads successfully**
3. ✅ **User info displays correctly**
4. ✅ **All editable fields work**
5. ✅ **Beautiful modern UI**

---

## 🐛 Still Having Issues?

If you STILL see 406 errors after clearing cache:

### Check Browser Console
Look for the actual request URL. It should now show:
```
/rest/v1/users?select=id,name,signature_url,aade_enabled...
```

NOT:
```
/rest/v1/users?select=*
```

If it still shows `select=*`, the cache wasn't cleared properly.

### Try This:
```bash
# Kill ALL node processes
pkill -f node

# Delete everything
rm -rf node_modules
rm -rf .expo
rm -rf node_modules/.cache

# Reinstall
npm install

# Start fresh
npx expo start --clear
```

---

## 📊 Verify Your Database

Run this in Supabase SQL Editor to verify your table structure:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

Should show:
- id
- name
- signature_url
- created_at
- updated_at
- aade_user_id
- aade_subscription_key
- company_vat_number
- company_name
- company_address
- company_activity
- aade_enabled

---

## 💡 Quick Test

After clearing cache, open the profile page and check the Console. You should see:
```
✅ User profile loaded successfully
```

NOT:
```
❌ Error getting user profile: 406
```

---

## Need More Help?

If none of this works:
1. Share your browser console logs (all errors)
2. Share the Network tab request/response
3. Let me know what platform you're testing on (web/iOS/Android)

