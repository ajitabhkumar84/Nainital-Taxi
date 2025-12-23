# 🚀 Quick Start - 2-Tier Pricing System

**Simplified pricing model with only 2 seasons: Off-Season and Season**

---

## What You Have Now

✅ **Simplified Schema** (`supabase/schema_final.sql`)
- 4 vehicle categories
- 2 seasons only (Off-Season, Season)
- Manual pricing table

✅ **Sample Data** (`supabase/seed_final.sql`)
- 10 vehicles across 4 categories
- 5 packages (3 tours + 2 transfers)
- 40 pricing entries (placeholder values)

---

## The Simplified Model

### Only 2 Seasons!

| Season | Description | Control |
|--------|-------------|---------|
| **Off-Season** | Regular pricing (default) | Year-round base rates |
| **Season** | Peak pricing | YOU control dates via SQL |

### Example: How It Works

```
Booking Date: April 20, 2025
Season dates: Apr 15 - Jun 30

System checks: Is Apr 20 within Apr 15 - Jun 30? ✅ YES
Result: Uses "Season" (peak) pricing

Booking Date: March 10, 2025
System checks: Is Mar 10 within Apr 15 - Jun 30? ❌ NO
Result: Uses "Off-Season" (regular) pricing
```

### Changing Season Dates (Anytime!)

```sql
-- Want to start peak pricing earlier?
UPDATE seasons
SET start_date = '2025-03-01',
    end_date = '2025-08-31'
WHERE name = 'Season';

-- Done! All bookings now use updated dates automatically.
```

---

## What You Need to Do

### 1. Provide Your Pricing (Only 40 Prices!)

For each package, you need **8 prices** (4 vehicles × 2 seasons):

#### Template for ONE Package:

```
PACKAGE NAME: _______________________

Off-Season Prices:
- Sedan (Dzire/Amaze/Xcent): ₹________
- SUV Normal (Ertiga/Triber): ₹________
- SUV Deluxe (Innova/Marazzo): ₹________
- SUV Luxury (Innova Crysta): ₹________

Season Prices:
- Sedan: ₹________
- SUV Normal: ₹________
- SUV Deluxe: ₹________
- SUV Luxury: ₹________
```

#### Your 5 Packages:

1. **Nainital Local Sightseeing** (8-10 hours, 40km)
2. **Bhimtal Lake Escape** (5-6 hours, 44km)
3. **Kainchi Dham Spiritual Journey** (4-5 hours, 34km)
4. **Pantnagar Airport → Nainital** (2 hours, 65km)
5. **Kathgodam Station → Nainital** (1.5 hours, 35km)

**Total: 5 packages × 8 prices = 40 prices**

### 2. Update seed_final.sql

Open `supabase/seed_final.sql` and find line 210. Replace the example prices with your actual prices:

```sql
-- Find this section and update the numbers:
INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
  -- OFF-SEASON
  (nainital_id, 'sedan', off_season_id, 2000, 'Sedan off-season'),
  (nainital_id, 'suv_normal', off_season_id, 2500, 'SUV Normal off-season'),
  ...

  -- SEASON (PEAK)
  (nainital_id, 'sedan', season_id, 2600, 'Sedan peak'),
  (nainital_id, 'suv_normal', season_id, 3200, 'SUV Normal peak'),
  ...
```

### 3. Run in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Run these in order:

```sql
-- Step 1: Create tables
-- Copy and paste supabase/schema_final.sql
-- Click "Run"

-- Step 2: Insert data
-- Copy and paste supabase/seed_final.sql (with YOUR prices)
-- Click "Run"
```

### 4. Verify Setup

After running the scripts, verify:

```sql
-- Check vehicles
SELECT name, vehicle_type FROM vehicles ORDER BY display_order;
-- Should show 10 vehicles

-- Check seasons
SELECT name, start_date, end_date FROM seasons;
-- Should show: Off-Season and Season

-- Check pricing count
SELECT COUNT(*) FROM pricing;
-- Should show: 40

-- View all prices
SELECT
  p.title as package,
  pr.vehicle_type,
  s.name as season,
  '₹' || pr.price as price
FROM pricing pr
JOIN packages p ON pr.package_id = p.id
JOIN seasons s ON pr.season_id = s.id
ORDER BY p.display_order, s.name DESC, pr.vehicle_type;
```

---

## Common Operations

### Update a Price

**Via Supabase Dashboard:**
1. Go to **Database > Tables > pricing**
2. Find the row (filter by package/vehicle/season)
3. Click **Edit**
4. Change the `price` field
5. Click **Save**

**Via SQL:**
```sql
UPDATE pricing
SET price = 3000
WHERE package_id = (SELECT id FROM packages WHERE slug = 'nainital-darshan')
  AND vehicle_type = 'sedan'
  AND season_id = (SELECT id FROM seasons WHERE name = 'Season');
```

### Change Season Dates

```sql
-- Update to Apr 1 - Aug 31
UPDATE seasons
SET start_date = '2025-04-01',
    end_date = '2025-08-31'
WHERE name = 'Season';

-- Update to May 15 - Jun 15 (shorter peak period)
UPDATE seasons
SET start_date = '2025-05-15',
    end_date = '2025-06-15'
WHERE name = 'Season';
```

### Add New Package

1. **Add to packages table:**
```sql
INSERT INTO packages (slug, title, type, duration, distance, ...) VALUES
  ('new-tour', 'New Amazing Tour', 'tour', '6 hours', 50, ...);
```

2. **Add 8 pricing entries:**
```sql
-- Get the package ID
SELECT id FROM packages WHERE slug = 'new-tour';

-- Add prices (repeat for all 4 vehicles × 2 seasons)
INSERT INTO pricing (package_id, vehicle_type, season_id, price) VALUES
  ('package-uuid-here', 'sedan', (SELECT id FROM seasons WHERE name = 'Off-Season'), 1800),
  ('package-uuid-here', 'sedan', (SELECT id FROM seasons WHERE name = 'Season'), 2300),
  ...
```

---

## How Pricing Lookup Works

When a customer books:

```typescript
// In your booking code:
import { getPrice } from '@/lib/supabase/queries_v2';

// Customer selects:
const packageId = 'abc-123';
const vehicleType = 'suv_deluxe';
const bookingDate = '2025-05-20';

// Get price:
const priceResult = await getPrice(packageId, vehicleType, bookingDate);

// Result:
{
  price: 4500,
  package_id: 'abc-123',
  vehicle_type: 'suv_deluxe',
  season_id: 'xyz-789',
  season_name: 'Season'
}
```

The function:
1. Checks if booking date falls within Season dates
2. Looks up price in pricing table for that season
3. Returns the exact price you submitted

**No calculations. No multipliers. Just your price.**

---

## Frontend Integration

### Update Imports

Replace old queries with v2:

```typescript
// OLD
import { getPackages, calculatePrice } from '@/lib/supabase';

// NEW
import { getPackages, getPrice } from '@/lib/supabase/queries_v2';
```

### Display Prices

```typescript
// Get package prices for all vehicle types
const prices = await getPackagePrices(packageId, bookingDate);

// Display to user:
prices.forEach(p => {
  console.log(`${p.vehicle_type}: ₹${p.price}`);
  // sedan: ₹2600
  // suv_normal: ₹3200
  // suv_deluxe: ₹4500
  // suv_luxury: ₹5800
});
```

### Show Current Season

```typescript
const season = await getCurrentSeason(bookingDate);

if (season.name === 'Season') {
  // Show "Peak Season Pricing" badge
}
```

---

## Benefits Recap

| Feature | Old System | New System |
|---------|-----------|------------|
| Seasons | 4 (Regular, Summer, Diwali, Winter) | **2 (Off-Season, Season)** |
| Total Prices | 80 entries | **40 entries** |
| Season Control | Fixed dates | **YOU control dates** |
| Pricing Method | Formula calculation | **Direct lookup** |
| Management | Complex | **Simple** |

---

## Quick Reference

### File Locations

```
supabase/
├── schema_final.sql     ← Database structure
└── seed_final.sql       ← Sample data (UPDATE PRICES HERE)

src/lib/supabase/
├── types.ts            ← TypeScript interfaces
├── queries_v2.ts       ← New query functions
├── client.ts           ← Supabase client (browser)
└── server.ts           ← Supabase client (server)
```

### Key Functions

```typescript
// Get price for specific booking
getPrice(packageId, vehicleType, date)

// Get all prices for a package
getPackagePrices(packageId, date)

// Get current season
getCurrentSeason(date)

// Get all vehicles of a type
getVehicles(vehicleType)

// Create booking with price
createBooking({ ...data, final_price, season_id })
```

### SQL Commands

```sql
-- View all pricing
SELECT * FROM pricing;

-- Update season dates
UPDATE seasons SET start_date = 'YYYY-MM-DD', end_date = 'YYYY-MM-DD' WHERE name = 'Season';

-- Update a price
UPDATE pricing SET price = 3500 WHERE id = 'uuid-here';

-- Check which season applies to a date
SELECT * FROM seasons WHERE start_date <= '2025-05-20' AND end_date >= '2025-05-20';
```

---

## Need Help?

- **Detailed migration**: See `MIGRATION_GUIDE.md`
- **Full changes summary**: See `UPDATES_SUMMARY.md`
- **Example pricing**: See `seed_final.sql` (around line 210)
- **Type definitions**: See `src/lib/supabase/types.ts`

---

## Next Steps

1. ✅ Provide your pricing (send me the 40 prices)
2. ✅ I'll update `seed_final.sql`
3. ✅ You run both SQL files in Supabase
4. ✅ Update frontend imports to use `queries_v2.ts`
5. ✅ Test booking flow with new pricing
6. ✅ Adjust Season dates as needed

---

**That's it! Your simplified 2-tier pricing system is ready to go.** 🎉
