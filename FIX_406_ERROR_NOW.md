# 🚨 FIX 406 ERROR - DO THIS NOW!

## The Problem

You're getting **406 errors** because the database is missing columns that the app needs.

Error: `Cannot coerce the result to a single JSON object - 0 rows`

This means when you click SAVE, the database rejects the update because columns like `deposit_amount`, `insurance_cost`, `car_category`, `car_color`, `exterior_condition`, etc. **don't exist yet**.

## ✅ THE FIX (5 Minutes)

### **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Select your project: **AGGELOS Rentals**
3. Click on **SQL Editor** in the left menu

### **Step 2: Run This SQL (Copy & Paste)**

```sql
-- Add missing fields to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS car_category TEXT,
ADD COLUMN IF NOT EXISTS car_color TEXT,
ADD COLUMN IF NOT EXISTS exterior_condition TEXT,
ADD COLUMN IF NOT EXISTS interior_condition TEXT,
ADD COLUMN IF NOT EXISTS mechanical_condition TEXT,
ADD COLUMN IF NOT EXISTS condition_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Success message
SELECT '✅ All contract fields added successfully!' as status;
```

### **Step 3: Run User Profile SQL**

```sql
-- Add missing fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS aade_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS aade_username TEXT,
ADD COLUMN IF NOT EXISTS aade_subscription_key TEXT,
ADD COLUMN IF NOT EXISTS company_vat_number TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_activity TEXT;

-- Success message
SELECT '✅ All user fields added successfully!' as status;
```

### **Step 4: Restart Your App**

After running the SQL:
1. Stop your dev server (Ctrl+C)
2. Restart: `npm start` or `npx expo start`
3. Refresh your browser

### **Step 5: Test**

1. Click on a contract
2. Click Edit
3. Change the name
4. Click Save
5. ✅ You should see: **"✅ Επιτυχία! Το συμβόλαιο ενημερώθηκε επιτυχώς!"**
6. ✅ No more 406 errors in console!

## 🎯 What This Does

### **Before:**
- Database has limited columns
- App tries to update non-existent columns
- Supabase returns 406 error
- Nothing saves ❌

### **After:**
- Database has ALL columns
- App successfully updates all fields
- Success notification shows
- Everything saves ✅

## 📝 Quick Copy-Paste

**Just copy these two SQL blocks and run them in Supabase SQL Editor:**

### SQL Block 1 - Contracts:
```sql
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2) DEFAULT 0, ADD COLUMN IF NOT EXISTS insurance_cost NUMERIC(10, 2) DEFAULT 0, ADD COLUMN IF NOT EXISTS car_category TEXT, ADD COLUMN IF NOT EXISTS car_color TEXT, ADD COLUMN IF NOT EXISTS exterior_condition TEXT, ADD COLUMN IF NOT EXISTS interior_condition TEXT, ADD COLUMN IF NOT EXISTS mechanical_condition TEXT, ADD COLUMN IF NOT EXISTS condition_notes TEXT, ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

### SQL Block 2 - Users:
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT, ADD COLUMN IF NOT EXISTS phone TEXT, ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS signature_url TEXT, ADD COLUMN IF NOT EXISTS aade_enabled BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS aade_username TEXT, ADD COLUMN IF NOT EXISTS aade_subscription_key TEXT, ADD COLUMN IF NOT EXISTS company_vat_number TEXT, ADD COLUMN IF NOT EXISTS company_name TEXT, ADD COLUMN IF NOT EXISTS company_address TEXT, ADD COLUMN IF NOT EXISTS company_activity TEXT;
```

## ⚡ After Running SQL

**Immediately you'll get:**
- ✅ No more 406 errors
- ✅ Save button works
- ✅ Success notifications appear
- ✅ All changes persist
- ✅ **100% WORKING!**

## 🔥 DO THIS NOW!

1. Open Supabase Dashboard
2. SQL Editor
3. Paste SQL Block 1
4. Run
5. Paste SQL Block 2
6. Run
7. Restart app
8. **PROBLEM SOLVED!** ✅

