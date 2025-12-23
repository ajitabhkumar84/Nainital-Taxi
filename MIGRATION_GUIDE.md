# 🔄 Migration Guide - Simplified 2-Tier Pricing

## Overview

This guide covers the major updates to your database schema and pricing model:

1. **New Vehicle Categories**: 4 types instead of 3
2. **Manual Pricing**: Prices submitted by you, not calculated by formulas
3. **Simplified Seasons**: Only 2 seasons (Off-Season and Season) instead of 4

---

## What Changed?

### 1. Vehicle Categories (UPDATED)

#### Old Structure:
```typescript
- sedan
- suv
- tempo_traveller
- luxury
```

#### New Structure:
```typescript
- sedan              // Dzire, Amaze, Xcent
- suv_normal         // Ertiga, Triber, Xylo, Tavera
- suv_deluxe         // Innova, Marazzo
- suv_luxury         // Innova Crysta
```

### 2. Pricing Model (COMPLETELY CHANGED)

#### Old System: Formula-Based
```
Final Price = Base Price × Vehicle Multiplier × Season Multiplier

Example:
₹2,000 (base) × 1.4 (SUV) × 1.3 (summer) = ₹3,640
```

#### New System: Manual Entry
```
You submit the exact price for each:
- Package
- Vehicle Type
- Season

Example pricing table entry:
Package: Nainital Darshan
Vehicle: suv_luxury
Season: Summer Peak
Price: ₹5,800 (YOU decide this)
```

---

## Files Created

### 1. **supabase/schema_final.sql** (FINAL)
- Updated schema with new vehicle types
- New `pricing` table for manual prices
- Removed price multipliers from packages table
- **Constraint: Only 2 seasons allowed (Off-Season, Season)**

### 2. **supabase/seed_final.sql** (FINAL)
- 10 vehicles with new categories
- Example pricing entries (YOU NEED TO UPDATE THESE)
- **Only 2 seasons (Off-Season, Season)**
- 40 pricing entries (5 packages × 4 vehicles × 2 seasons)

### 3. **src/lib/supabase/queries_v2.ts** (NEW)
- `getPrice()` - Looks up manual prices (no calculations)
- `getPackagePrices()` - Gets all prices for a package
- All other query functions updated

### 4. **Updated Type Definitions**
- `types.ts` - New vehicle types, Pricing interface
- `VehicleTypeDisplayNames` - Helper for UI display

---

## Migration Steps

### Step 1: Backup Current Database (IMPORTANT!)

```bash
# Export current data
npx supabase db dump -f backup_old_schema.sql
```

### Step 2: Run New Schema

1. Go to Supabase Dashboard > SQL Editor
2. **NEW QUERY** (don't run on existing tables!)
3. Copy and paste `supabase/schema_final.sql`
4. Click **Run**

**⚠️ WARNING**: This will create NEW tables. If you have existing data, you'll need to migrate it manually.

### Step 3: Update Pricing Data

The seed file includes EXAMPLE prices. **You must update these with your actual prices.**

#### Edit `supabase/seed_final.sql`:

Find this section (around line 210):

```sql
-- ======================================
-- NAINITAL DARSHAN PRICING
-- ======================================

INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
  -- OFF-SEASON (CHANGE THESE PRICES)
  (nainital_id, 'sedan', off_season_id, 2000, 'Sedan off-season'),
  (nainital_id, 'suv_normal', off_season_id, 2500, 'SUV Normal off-season'),
  (nainital_id, 'suv_deluxe', off_season_id, 3500, 'SUV Deluxe off-season'),
  (nainital_id, 'suv_luxury', off_season_id, 4500, 'Crysta off-season'),

  -- SEASON / PEAK (CHANGE THESE PRICES)
  (nainital_id, 'sedan', season_id, 2600, 'Sedan peak season'),
  (nainital_id, 'suv_normal', season_id, 3200, 'SUV Normal peak'),
  (nainital_id, 'suv_deluxe', season_id, 4500, 'SUV Deluxe peak'),
  (nainital_id, 'suv_luxury', season_id, 5800, 'Crysta peak');
```

**Change the prices to your actual rates!**

### Step 4: Run Seed Data

After updating prices in `seed_final.sql`:

1. Supabase Dashboard > SQL Editor
2. Copy and paste `seed_final.sql`
3. Click **Run**

### Step 5: Update Frontend Code

#### Old Code (Queries):
```typescript
import { getPackages, calculatePrice } from '@/lib/supabase';

// Old: Calculate price
const pricing = await calculatePrice(packageId, 'suv', date);
// Returns: { base_price, vehicle_multiplier, season_multiplier, final_price }
```

#### New Code (Queries V2):
```typescript
import { getPackages, getPrice } from '@/lib/supabase/queries_v2';

// New: Look up price
const priceResult = await getPrice(packageId, 'suv_luxury', date);
// Returns: { price, package_id, vehicle_type, season_id, season_name }
```

#### Update Imports:

Replace in all files:
```typescript
// OLD
import { ... } from '@/lib/supabase';

// NEW
import { ... } from '@/lib/supabase/queries_v2';
```

---

## Pricing Table Structure

### How to Add/Update Prices

#### Option 1: Via SQL (Bulk Update)

```sql
INSERT INTO pricing (package_id, vehicle_type, season_id, price, notes) VALUES
  (
    (SELECT id FROM packages WHERE slug = 'nainital-darshan'),
    'sedan',
    (SELECT id FROM seasons WHERE name = 'Regular Season'),
    2000,
    'Updated price for regular season'
  );
```

#### Option 2: Via Supabase Dashboard

1. Go to **Database > Tables > pricing**
2. Click **Insert row**
3. Fill in:
   - `package_id`: Select from dropdown
   - `vehicle_type`: sedan / suv_normal / suv_deluxe / suv_luxury
   - `season_id`: Select season (or NULL for regular)
   - `price`: Your price in INR
   - `notes`: Optional notes
4. Click **Save**

---

## Required Pricing Entries (SIMPLIFIED!)

For each package, you need prices for:

### 4 Vehicle Types:
1. `sedan`
2. `suv_normal`
3. `suv_deluxe`
4. `suv_luxury`

### 2 Seasons (for each vehicle type):
1. Off-Season (regular/base pricing)
2. Season (peak pricing - YOU control dates)

**Total entries per package**: 4 vehicles × 2 seasons = **8 pricing entries**

**For entire system**: 5 packages × 8 entries = **40 total prices**

### Example Pricing Sheet

| Package | Vehicle | Season | Price |
|---------|---------|--------|-------|
| Nainital Darshan | Sedan | Off-Season | ₹2,000 |
| Nainital Darshan | Sedan | Season | ₹2,600 |
| Nainital Darshan | SUV Normal | Off-Season | ₹2,500 |
| Nainital Darshan | SUV Normal | Season | ₹3,200 |
| Nainital Darshan | SUV Deluxe | Off-Season | ₹3,500 |
| Nainital Darshan | SUV Deluxe | Season | ₹4,500 |
| ... | ... | ... | ... |

---

## Vehicle Type Display Names

For UI display, use the helper constant:

```typescript
import { VehicleTypeDisplayNames } from '@/lib/supabase/types';

// In your component:
{VehicleTypeDisplayNames['sedan']}
// Outputs: "Sedan (Dzire/Amaze/Xcent)"

{VehicleTypeDisplayNames['suv_luxury']}
// Outputs: "SUV Luxury (Innova Crysta)"
```

---

## Testing the New System

### 1. Check Vehicle Types

```typescript
import { getVehicles } from '@/lib/supabase/queries_v2';

const sedans = await getVehicles('sedan');
const suvLuxury = await getVehicles('suv_luxury');

console.log(sedans); // Should show Dzire, Amaze, Xcent
console.log(suvLuxury); // Should show Innova Crysta vehicles
```

### 2. Check Price Lookup

```typescript
import { getPrice } from '@/lib/supabase/queries_v2';

const price = await getPrice(
  'package-uuid-here',
  'suv_deluxe',
  '2025-05-15' // Summer date
);

console.log(price);
// {
//   price: 4500,
//   package_id: '...',
//   vehicle_type: 'suv_deluxe',
//   season_id: '...',
//   season_name: 'Summer Peak'
// }
```

### 3. Test Booking Flow

```typescript
import { getPrice, createBooking } from '@/lib/supabase/queries_v2';

// 1. Get price
const priceResult = await getPrice(packageId, vehicleType, date);

// 2. Create booking with that price
const booking = await createBooking({
  customer_name: 'Test User',
  customer_phone: '+918445206116',
  package_id: packageId,
  package_name: 'Nainital Darshan',
  vehicle_type: vehicleType,
  booking_date: date,
  pickup_time: '09:00',
  pickup_location: 'Hotel',
  passengers: 4,
  final_price: priceResult.price,
  season_id: priceResult.season_id,
});
```

---

## FAQ

### Q: Do I need to fill in ALL pricing combinations?

**A:** Yes, you need all 8 prices per package (4 vehicles × 2 seasons = 8 prices).

This simplified system requires:
- Off-Season prices for all 4 vehicle types per package
- Season (peak) prices for all 4 vehicle types per package

Total: 40 prices for all 5 packages. Much simpler than the old 4-season system!

### Q: How do I update a price?

**A:** Go to Supabase Dashboard > pricing table > Find the row > Edit > Save

Or via SQL:
```sql
UPDATE pricing
SET price = 3000
WHERE package_id = (SELECT id FROM packages WHERE slug = 'nainital-darshan')
  AND vehicle_type = 'sedan'
  AND season_id = (SELECT id FROM seasons WHERE name = 'Summer Peak');
```

### Q: What if I add a new package?

**A:** You need to add pricing entries for that package:

1. Add package to `packages` table
2. Add 8 pricing entries (4 vehicles × 2 seasons)

### Q: How do I change when peak pricing applies?

**A:** Simply update the Season dates:

```sql
UPDATE seasons
SET start_date = '2025-05-01',
    end_date = '2025-08-31'
WHERE name = 'Season';
```

The system will automatically use peak prices for any booking within that date range!

### Q: Can I have multiple peak periods?

**A:** With the simplified 2-season model, you have one "Season" period. To change it:
- Update the dates for different times of year
- Or, keep it broad (e.g., Apr-Oct covers all peak months)

This simplicity means less management and fewer pricing entries!

---

## Summary of Changes

| Aspect | Old | New |
|--------|-----|-----|
| **Vehicle Types** | 4 types (sedan, suv, tempo, luxury) | 4 types (sedan, suv_normal, suv_deluxe, suv_luxury) |
| **Pricing** | Formula: base × vehicle × season | Manual: Look up from pricing table |
| **Seasons** | 4 seasons (Regular, Summer, Diwali, Winter) | **2 seasons (Off-Season, Season)** |
| **Package Table** | Had multipliers | No multipliers, just metadata |
| **Price Entry** | Automatic calculation | You submit each price |
| **Total Prices** | 80 entries (5 packages × 4 vehicles × 4 seasons) | **40 entries (5 packages × 4 vehicles × 2 seasons)** |
| **Season Control** | Fixed date ranges | **YOU control Season dates via SQL** |
| **Flexibility** | Limited to formula | Full control over every price |

---

## Next Steps

1. ✅ Review the example prices in `seed_final.sql`
2. ✅ Update prices with your actual rates (only 40 prices needed!)
3. ✅ Run `schema_final.sql` in Supabase
4. ✅ Run updated `seed_final.sql` in Supabase
5. ✅ Update frontend code to use `queries_v2.ts`
6. ✅ Test the new pricing lookup
7. ✅ Verify all vehicle types display correctly
8. ✅ Test changing Season dates and verify pricing updates automatically

---

## Key Benefits of Simplified System

- **50% fewer pricing entries** (40 instead of 80)
- **Dynamic season control** - change dates anytime
- **Simpler to understand** - just Off-Season and Season
- **Easier to maintain** - fewer prices to update
- **Full flexibility** - YOU control when peak pricing applies

---

**Need help?**
- Quick guide: Check `QUICKSTART.md`
- Pricing table: Supabase Dashboard > pricing table
- Season dates: One SQL UPDATE command!
