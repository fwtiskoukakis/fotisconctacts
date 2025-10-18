# 📋 Database Setup Checklist

Follow these steps to populate your database with data so the app shows information.

## ✅ Step 1: Insert Cars Data

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `supabase/insert-cars-data.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run** or press `Ctrl+Enter`

**Expected Result:** 29 cars inserted into the `cars` table

### Verify:
```sql
SELECT COUNT(*) FROM public.cars;
-- Should return: 29
```

---

## ✅ Step 2: Insert Contracts and Damages Data

1. Still in **Supabase SQL Editor**
2. Open the file: `supabase/insert-example-contracts-and-damages.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click **Run** or press `Ctrl+Enter`

**Expected Result:** 
- 8 contracts inserted
- 16 damage points inserted

### Verify:
```sql
-- Check contracts
SELECT COUNT(*) FROM public.contracts;
-- Should return: 8

-- Check damage points
SELECT COUNT(*) FROM public.damage_points;
-- Should return: 16

-- Check damages with contract info
SELECT 
  dp.id,
  dp.description,
  dp.severity,
  c.renter_full_name,
  c.car_license_plate
FROM public.damage_points dp
JOIN public.contracts c ON dp.contract_id = c.id
ORDER BY dp.created_at DESC;
-- Should return: 16 rows with full information
```

---

## ✅ Step 3: Verify in App

After running both SQL scripts:

### 1. **Cars Page** (`/cars`)
- Should show **29 cars**
- Mix of available and rented
- Different models: Fiat Panda, Peugeot 208, Citroen C3, etc.

### 2. **Contracts Page** (`/contracts`)
- Should show **8 contracts**
- Stats: Total, Active, Completed
- Different renters with Greek names

### 3. **Damage Report Page** (`/damage-report`)
- Should show **16 damage points**
- Stats: Total, Minor (8), Moderate (6), Severe (3)
- Each damage shows:
  - Car license plate
  - Renter name
  - Position (X%, Y%)
  - Severity badge
  - Description
  - Date/time

### 4. **Car Details Page** (click any car)
- **Overview Tab**: Car info + stats
- **Contracts Tab**: All contracts for that car
- **Damages Tab**: All damages from contracts
- **Payments Tab**: Placeholder

---

## 🔍 Troubleshooting

### Problem: "No data showing"

**Check 1: Database Connection**
```sql
-- Run in Supabase SQL Editor
SELECT current_database(), current_user;
```

**Check 2: Tables Exist**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cars', 'contracts', 'damage_points');
-- Should return 3 rows
```

**Check 3: Data Exists**
```sql
SELECT 
  (SELECT COUNT(*) FROM public.cars) as cars_count,
  (SELECT COUNT(*) FROM public.contracts) as contracts_count,
  (SELECT COUNT(*) FROM public.damage_points) as damages_count;
```

**Check 4: RLS Policies**
```sql
-- Check if Row Level Security is blocking access
SELECT * FROM public.cars LIMIT 1;
SELECT * FROM public.contracts LIMIT 1;
SELECT * FROM public.damage_points LIMIT 1;
```

If you get "permission denied" errors, you may need to disable RLS temporarily or add proper policies.

### Problem: "Foreign key constraint violation"

This means you're trying to insert contracts before having a user. 

**Solution:**
```sql
-- First, check if you have a user
SELECT id, email FROM auth.users LIMIT 1;

-- If no users, sign up in the app first, then run the scripts
```

### Problem: "Duplicate key value violates unique constraint"

This means the data already exists.

**Solution:**
```sql
-- Clear existing data and start fresh
DELETE FROM public.damage_points;
DELETE FROM public.contracts;
DELETE FROM public.cars;

-- Then run the insert scripts again
```

---

## 📊 Expected Data Summary

After setup, you should have:

### Cars (29 total)
- **Fiat Panda Hybrid**: 4 units (1 rented, 3 available)
- **Mitsubishi Spacestar**: 4 units (all available)
- **Fiat Panda**: 4 units (3 rented, 1 available)
- **Suzuki Celerio**: 2 units (all available)
- **Peugeot 208**: 3 units (2 rented, 1 available)
- **Citroen C3**: 3 units (1 rented, 2 available)
- **Kia Picanto**: 1 unit (rented)
- **MG ZS**: 1 unit (available)
- **MG 3 Hybrid**: 1 unit (available)
- **Toyota Aygo**: 1 unit (available)
- **Citroen C1**: 1 unit (available)
- **Jeep Renegade**: 1 unit (available)
- **Mercedes GLB**: 1 unit (available)

### Contracts (8 total)
1. Γιώργος Παπαδόπουλος - Fiat Panda Hybrid (ΖΤΖ4206) - Completed
2. Μαρία Κωνσταντίνου - Peugeot 208 (ΧΗΖ6448) - Active
3. Νίκος Αθανασίου - Citroen C3 (ΒΜΖ1133) - Completed
4. Ελένη Δημητρίου - Fiat Panda (XEH1056) - Active
5. Κώστας Βασιλείου - Kia Picanto (ΙΥΥ5733) - Active
6. Σοφία Γεωργίου - Mitsubishi Spacestar (XPI1202) - Completed
7. Δημήτρης Ιωάννου - MG ZS (XHE7736) - Completed
8. Αννα Χριστοδούλου - Suzuki Celerio (BKA9814) - Completed

### Damages (16 total)
- **Minor**: 8 damages (scratches, chips, fading)
- **Moderate**: 6 damages (dents, paint wear, cracks)
- **Severe**: 3 damages (breaks, major cracks)

---

## 🎯 Quick Test

After setup, open the app and:

1. ✅ Go to `/cars` - Should see 29 cars
2. ✅ Click on "ΖΤΖ4206" - Should see 1 contract and 2 damages
3. ✅ Go to `/contracts` - Should see 8 contracts
4. ✅ Go to `/damage-report` - Should see 16 damages
5. ✅ Click any damage - Should navigate to contract details

---

## 📝 Console Logs

The app now has debugging enabled. Check your browser console (F12) for:

```
Loading damages from Supabase...
Damages query result: { data: [...], error: null }
Loaded 16 damages successfully
```

If you see errors, they will show the exact problem!

---

## 🆘 Still Having Issues?

1. **Check browser console** (F12) for errors
2. **Check Supabase logs** in the dashboard
3. **Verify your `.env` file** has correct Supabase credentials
4. **Try refreshing the page** (pull down on mobile)
5. **Clear app cache** and restart

---

## ✨ Success Indicators

You'll know it's working when:

- ✅ Stats cards show numbers (not zeros)
- ✅ Lists show actual data (not "No data" messages)
- ✅ Clicking items navigates to detail pages
- ✅ Car details show contracts and damages
- ✅ Breadcrumbs show correct navigation path
- ✅ Bottom tab bar is visible on all pages

---

**Need Help?** Check the console logs first - they now show detailed error messages!

