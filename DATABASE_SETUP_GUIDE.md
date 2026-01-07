# 🗄️ Database Setup Guide - Nainital Taxi

This guide will help you set up your Supabase database from scratch.

## Prerequisites

- Supabase account (free tier is sufficient to start)
- Supabase project created
- Database credentials from your `.env.local` file

## 📋 Setup Steps

### Step 1: Access Supabase SQL Editor

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project: `pjdseqinttikdjowaytg`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Database Schema

**File:** `supabase/schema_enhanced.sql`

This is the main database schema with:
- 11 core tables (profiles, vehicles, destinations, packages, pricing, seasons, bookings, etc.)
- All enums (booking_status, vehicle_type, etc.)
- Database views for analytics
- Indexes for performance
- Triggers for automated updates

**Action:**
1. Copy the entire contents of `supabase/schema_enhanced.sql`
2. Paste into Supabase SQL Editor
3. Click **Run** (or press Ctrl/Cmd + Enter)
4. Wait for "Success. No rows returned" message

**Expected Result:** All tables, enums, and indexes created

---

### Step 3: Run Database Functions

**File:** `supabase/functions.sql`

Contains 8+ PostgreSQL functions:
- `get_season_for_date()` - Determines season based on date
- `calculate_package_price()` - Server-side pricing calculation
- `increment_cars_booked()` / `decrement_cars_booked()` - Availability management
- `is_booking_allowed()` - Checks blackout periods
- `get_next_waitlist_entry()` - Waitlist queue management
- Analytics functions

**Action:**
1. Copy the entire contents of `supabase/functions.sql`
2. Paste into a new query in Supabase SQL Editor
3. Click **Run**

**Expected Result:** All functions created successfully

---

### Step 4: Enable Row Level Security (RLS) Policies

**File:** `supabase/enable_rls_with_policies.sql`

Sets up security policies:
- Public read access for vehicles, packages, destinations, pricing
- Protected write access (admin only)
- User-specific access for bookings

**Action:**
1. Copy the entire contents of `supabase/enable_rls_with_policies.sql`
2. Paste into a new query
3. Click **Run**

**Expected Result:** RLS enabled on all tables with appropriate policies

---

### Step 5: Seed Initial Data

**File:** `supabase/seed_enhanced.sql`

Populates the database with:
- Sample vehicles (4 types: Sedan, SUV Normal, SUV Deluxe, SUV Luxury)
- Destinations (Kathgodam, Pantnagar, Kainchi Dham, Ranikhet, Mukteshwar, Jim Corbett)
- Tour packages (7 packages matching your actual offerings)
- Pricing for all package/vehicle combinations
- Season periods (Off-Season and Peak Season)
- Sample bookings for testing

**Action:**
1. Copy the entire contents of `supabase/seed_enhanced.sql`
2. Paste into a new query
3. Click **Run**

**Expected Result:** Database populated with sample data

---

## ✅ Verification Steps

### Check Tables Created
Run this query to see all your tables:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables (11):**
- admin_settings
- availability
- booking_blackout
- booking_status_history
- bookings
- destinations
- packages
- pricing
- profiles
- reviews
- seasons
- vehicles
- waitlist

### Check Sample Data
Run these queries to verify data:

```sql
-- Check vehicles
SELECT name, vehicle_type, status FROM vehicles;

-- Check destinations
SELECT name, slug FROM destinations;

-- Check packages
SELECT title, package_type FROM packages;

-- Check pricing
SELECT COUNT(*) FROM pricing; -- Should have 28 rows (7 packages × 4 vehicle types)

-- Check seasons
SELECT * FROM seasons ORDER BY start_date;
```

### Check Functions
Verify functions are working:

```sql
-- Test season detection
SELECT get_season_for_date('2025-12-25'::DATE);
-- Should return: 'Season'

SELECT get_season_for_date('2025-08-15'::DATE);
-- Should return: 'Off-Season'

-- Test booking allowed check
SELECT is_booking_allowed('2025-12-25'::DATE);
-- Should return: true (unless you've added blackout dates)
```

### Check RLS Policies
Verify RLS is enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`

---

## 🔧 Troubleshooting

### Error: "Extension uuid-ossp does not exist"
**Solution:** Run this first:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "relation already exists"
**Solution:** You've already run the schema. To start fresh:
1. Run `supabase/cleanup_complete.sql` to drop all tables
2. Re-run schema_enhanced.sql

### Error: "permission denied"
**Solution:** Make sure you're using the service role key or are logged in as the database owner

### No data showing in tables
**Solution:**
1. Make sure you ran `seed_enhanced.sql`
2. Check for errors in the SQL output
3. Verify data with SELECT queries above

---

## 🎯 Post-Setup Tasks

### 1. Update Package Data
The seed data has placeholder content. Update with real information:

```sql
-- Update package descriptions, itineraries, etc.
UPDATE packages SET
  description = 'Your actual description here',
  detailed_description = 'Detailed info here'
WHERE slug = 'kathgodam-to-nainital-taxi';
```

### 2. Update Pricing
Adjust prices to match your actual rates:

```sql
-- Update pricing for specific packages
UPDATE pricing SET
  off_season_price = 1500,
  season_price = 2000
WHERE package_id = (SELECT id FROM packages WHERE slug = 'kathgodam-to-nainital-taxi')
  AND vehicle_type = 'sedan';
```

### 3. Update Destinations
Add real photos and descriptions:

```sql
UPDATE destinations SET
  hero_image = 'https://your-actual-image-url.com/image.jpg',
  description = 'Your actual destination description'
WHERE slug = 'kathgodam';
```

### 4. Add Real Vehicles
Replace sample vehicles with your actual fleet:

```sql
UPDATE vehicles SET
  registration_number = 'UK01AB1234',
  model_name = 'Maruti Dzire VXi',
  featured_image_url = 'https://your-vehicle-photo.com/image.jpg'
WHERE name = 'Sedan 1';
```

### 5. Set Up Season Dates
Update season dates for the current/upcoming year:

```sql
-- Update peak season dates (adjust for your business)
UPDATE seasons SET
  start_date = '2025-12-20',
  end_date = '2026-01-05'
WHERE name = 'Season';

-- Add additional season periods (long weekends, etc.)
INSERT INTO seasons (name, description, start_date, end_date, price_multiplier, priority)
VALUES
  ('Holi Weekend 2025', 'Holi celebration period', '2025-03-13', '2025-03-16', 1.3, 2),
  ('Diwali 2025', 'Diwali festival period', '2025-10-20', '2025-10-24', 1.3, 2);
```

---

## 🚀 Next Steps

After database setup:

1. ✅ Verify all data is loading in your Next.js app
2. ✅ Test the booking flow end-to-end
3. ✅ Check admin panel can read/write data
4. ✅ Update environment variables with production database URL
5. ✅ Configure RLS policies for production security
6. ✅ Set up database backups (automatic in Supabase)
7. ✅ Monitor database performance in Supabase Dashboard

---

## 📊 Database Statistics

After setup, you should have approximately:

- **Vehicles:** 12-16 sample vehicles (3-4 per type)
- **Destinations:** 6 destinations
- **Packages:** 7 tour packages
- **Pricing Rows:** 28 (7 packages × 4 vehicle types)
- **Seasons:** 2 base seasons (Off-Season, Season)
- **Sample Bookings:** 5-10 for testing

---

## 🔒 Security Notes

1. **Row Level Security (RLS)** is enabled on all tables
2. **Public read access** is allowed for: vehicles, packages, destinations, pricing, seasons
3. **Write access** requires authentication (admin routes protected)
4. **Bookings table** has user-specific RLS policies
5. **Service role key** should ONLY be used server-side (API routes)

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs: Project → Logs → Postgres Logs
2. Review error messages carefully
3. Verify environment variables are correct
4. Ensure you're using the correct database URL

---

**Database setup complete!** 🎉

Your Nainital Taxi booking platform now has a production-ready database schema with sample data.
