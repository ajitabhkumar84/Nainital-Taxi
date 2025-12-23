# 🚀 Enhanced Features Guide

## Overview

Your Nainital Taxi database now includes powerful new features:

1. ✅ **Your 7 actual packages with real pricing**
2. ✅ **Multiple season periods** (handle long weekends easily)
3. ✅ **Booking blackout dates** (block online booking for specific dates)
4. ✅ **Priority-based season selection**

---

## New Files Created

| File | Purpose |
|------|---------|
| `supabase/schema_enhanced.sql` | Enhanced database schema with new features |
| `supabase/seed_enhanced.sql` | Your 7 packages with actual pricing |
| `src/lib/supabase/queries_enhanced.ts` | Frontend functions for new features |
| `ENHANCED_FEATURES.md` | This documentation |

---

## Feature 1: Multiple Season Periods

### Problem Solved

**Before:** You could only have one "Season" period (e.g., Apr 15 - Jun 30).
**Issue:** Long weekends within off-season (like Republic Day, Holi) needed peak pricing too.

**Now:** You can have **multiple "Season" periods** throughout the year!

### How It Works

Each season period has a **priority number**. When dates overlap, higher priority wins.

```sql
-- Base off-season (priority 0 - lowest)
INSERT INTO seasons (name, start_date, end_date, priority) VALUES
  ('Off-Season', '2025-01-01', '2025-12-31', 0);

-- Main summer season (priority 10)
INSERT INTO seasons (name, start_date, end_date, priority) VALUES
  ('Season', '2025-04-15', '2025-06-30', 10);

-- Long weekends (priority 20 - highest, overrides off-season)
INSERT INTO seasons (name, start_date, end_date, priority) VALUES
  ('Season', 'Republic Day', '2025-01-25', '2025-01-26', 20),
  ('Season', 'Holi weekend', '2025-03-14', '2025-03-16', 20),
  ('Season', 'Diwali period', '2025-10-20', '2025-11-05', 20);
```

### Example: What Price is Used?

```
Date: January 26, 2025 (Republic Day)

Step 1: Find all matching seasons
  - Off-Season (Jan 1 - Dec 31, priority 0) ✓
  - Season/Republic Day (Jan 25-26, priority 20) ✓

Step 2: Pick highest priority
  → Season (priority 20) wins!

Result: Peak pricing applied! 🎯
```

### Adding New Long Weekends

**SQL:**
```sql
-- Add Independence Day weekend
INSERT INTO seasons (name, description, start_date, end_date, priority, is_active)
VALUES ('Season', 'Independence Day weekend', '2025-08-15', '2025-08-17', 20, TRUE);
```

**Via Supabase Dashboard:**
1. Go to **Database > Tables > seasons**
2. Click **Insert row**
3. Fill in:
   - `name`: Season
   - `description`: Independence Day weekend
   - `start_date`: 2025-08-15
   - `end_date`: 2025-08-17
   - `priority`: 20
   - `is_active`: TRUE
4. Click **Save**

Done! Peak pricing now applies Aug 15-17! 🎉

---

## Feature 2: Booking Blackout Dates

### Problem Solved

**Before:** No way to disable online booking for specific dates.
**Issue:** During peak demand (Jan 20-30, Diwali, etc.), you want manual booking only.

**Now:** You can **block online booking** while still showing prices and contact info!

### How It Works

When a date falls within an active blackout period:
- ❌ Booking form is disabled
- ✅ Prices are still visible
- ✅ "Call/WhatsApp us" message is shown
- ✅ Season-based pricing is displayed

### Example Blackout Periods (Already in seed data)

```sql
-- Block Jan 20-30
INSERT INTO booking_blackout (start_date, end_date, reason, show_message, is_active)
VALUES (
  '2025-01-20',
  '2025-01-30',
  'Peak demand - advance planning required',
  'Online booking unavailable. Call +918445206116 or WhatsApp us.',
  FALSE  -- Set to TRUE to activate
);

-- Block during Diwali
INSERT INTO booking_blackout (start_date, end_date, reason, show_message, is_active)
VALUES (
  '2025-10-28',
  '2025-11-02',
  'Diwali rush - confirmed bookings only',
  'Due to high demand, online booking is closed. Call us at +918445206116.',
  FALSE  -- Set to TRUE to activate
);
```

### Activating Blackout Dates

**SQL:**
```sql
-- Enable Jan 20-30 blackout
UPDATE booking_blackout
SET is_active = TRUE
WHERE start_date = '2025-01-20';

-- Disable it later
UPDATE booking_blackout
SET is_active = FALSE
WHERE start_date = '2025-01-20';
```

**Via Supabase Dashboard:**
1. Go to **Database > Tables > booking_blackout**
2. Find the row (filter by start_date)
3. Click **Edit**
4. Change `is_active` to `TRUE`
5. Click **Save**

**Effect:** Online booking is now blocked for Jan 20-30! Users see your custom message instead.

### Adding New Blackout Periods

```sql
INSERT INTO booking_blackout (start_date, end_date, reason, show_message, is_active)
VALUES (
  '2025-12-25',
  '2025-12-26',
  'Christmas holiday',
  'Office closed for Christmas. Bookings resume Dec 27. WhatsApp: +918445206116',
  TRUE
);
```

---

## Feature 3: Your 7 Actual Packages

All packages from your pricing sheet are now in the database:

| # | Package Name | Slug | Type |
|---|-------------|------|------|
| 1 | Nainital Darshan | `nainital-darshan` | tour |
| 2 | Lake Tour + Kainchi Dham | `lake-tour-kainchi-dham` | tour |
| 3 | Mukteshwar Day Tour | `mukteshwar-day-tour` | tour |
| 4 | Ranikhet Day tour + Kainchi Dham | `ranikhet-kainchi-dham` | tour |
| 5 | Neem Karoli 4 Dham Package | `neem-karoli-4-dham` | tour |
| 6 | Kathgodam to Nainital Drop | `kathgodam-nainital-drop` | transfer |
| 7 | Pantnagar to Nainital Drop | `pantnagar-nainital-drop` | transfer |

### Pricing Summary

**Total prices: 56** (7 packages × 4 vehicles × 2 seasons)

Example for **Nainital Darshan**:

| Vehicle | Off-Season | Season |
|---------|-----------|---------|
| Sedan | ₹2,500 | ₹3,000 |
| SUV Basic | ₹3,300 | ₹3,800 |
| SUV Deluxe | ₹3,700 | ₹4,200 |
| SUV Luxury | ₹4,000 | ₹4,500 |

All your exact prices from the image are in `seed_enhanced.sql`!

---

## Frontend Integration

### 1. Check if Booking is Allowed

```typescript
import { isBookingAllowed, getPrice } from '@/lib/supabase/queries_enhanced';

// When user selects a date
const bookingStatus = await isBookingAllowed('2025-01-25');

if (!bookingStatus.allowed) {
  // Show contact message instead of booking form
  alert(bookingStatus.message);
  // Display: "Online booking unavailable. Call +918445206116 or WhatsApp us."
}
```

### 2. Get Price with Season Detection

```typescript
import { getPrice } from '@/lib/supabase/queries_enhanced';

// User selects: Nainital Darshan, SUV Deluxe, Jan 26
const priceInfo = await getPrice(
  'package-id-here',
  'suv_deluxe',
  '2025-01-26'  // Republic Day (Season period)
);

console.log(priceInfo);
// {
//   price: 4200,
//   season_name: 'Season',  // Auto-detected!
//   season_description: 'Republic Day long weekend',
//   booking_allowed: true,
//   blackout_message: undefined
// }
```

### 3. Display Booking Form or Contact Message

```typescript
import { checkAvailability } from '@/lib/supabase/queries_enhanced';

const availability = await checkAvailability('2025-01-25');

if (!availability.booking_allowed) {
  // Show contact message
  return (
    <div className="alert alert-info">
      <p>{availability.blackout_message}</p>
      <div>
        <a href="tel:+918445206116">📞 Call Us</a>
        <a href="https://wa.me/918445206116">💬 WhatsApp</a>
      </div>
    </div>
  );
}

// Show normal booking form
return <BookingForm />;
```

### 4. Show Current Season Badge

```typescript
import { getSeasonForDate } from '@/lib/supabase/queries_enhanced';

const season = await getSeasonForDate('2025-05-20');

{season.name === 'Season' && (
  <span className="badge badge-peak">
    🔥 Peak Season Pricing
  </span>
)}
```

---

## Complete Booking Flow Example

```typescript
import {
  getPrice,
  isBookingAllowed,
  checkAvailability,
  createBooking
} from '@/lib/supabase/queries_enhanced';

async function handleBooking(formData) {
  const { packageId, vehicleType, date, ...rest } = formData;

  // Step 1: Check availability
  const availability = await checkAvailability(date);

  if (!availability.available) {
    alert('No cars available on this date');
    return;
  }

  if (!availability.booking_allowed) {
    alert(availability.blackout_message);
    return;
  }

  // Step 2: Get price (with auto season detection)
  const priceInfo = await getPrice(packageId, vehicleType, date);

  // Step 3: Show confirmation
  const confirmed = confirm(
    `Total: ₹${priceInfo.price} (${priceInfo.season_name})\nProceed?`
  );

  if (!confirmed) return;

  // Step 4: Create booking
  try {
    const booking = await createBooking({
      package_id: packageId,
      vehicle_type: vehicleType,
      booking_date: date,
      final_price: priceInfo.price,
      season_name: priceInfo.season_name,
      ...rest
    });

    alert('Booking created! ID: ' + booking.id);
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
```

---

## Admin Management

### View All Season Periods

```sql
SELECT
  name,
  description,
  start_date,
  end_date,
  priority,
  is_active
FROM seasons
ORDER BY priority DESC, start_date;
```

### View All Blackout Periods

```sql
SELECT
  start_date,
  end_date,
  reason,
  show_message,
  is_active
FROM booking_blackout
ORDER BY start_date;
```

### Test Season Detection

```sql
-- What season is Jan 26?
SELECT get_season_for_date('2025-01-26');
-- Returns: 'Season' (Republic Day period, priority 20)

-- What season is Feb 15?
SELECT get_season_for_date('2025-02-15');
-- Returns: 'Off-Season' (no special period)
```

### Test Booking Allowance

```sql
-- Is booking allowed for Jan 25?
SELECT is_booking_allowed('2025-01-25');
-- Returns: TRUE or FALSE

-- Get blackout message if any
SELECT get_blackout_message('2025-01-25');
-- Returns: 'Online booking unavailable...' or NULL
```

---

## Common Scenarios

### Scenario 1: Add Long Weekend Peak Pricing

**Independence Day (Aug 15-17) should have peak pricing**

```sql
INSERT INTO seasons (name, description, start_date, end_date, priority, is_active)
VALUES ('Season', 'Independence Day weekend', '2025-08-15', '2025-08-17', 20, TRUE);
```

Done! No price changes needed - existing "Season" prices apply automatically! 🎯

### Scenario 2: Block Online Booking for a Week

**You're going on vacation Jan 10-17**

```sql
INSERT INTO booking_blackout (start_date, end_date, reason, show_message, is_active)
VALUES (
  '2025-01-10',
  '2025-01-17',
  'Office closed for vacation',
  'We''ll be back on Jan 18! For urgent bookings, WhatsApp: +918445206116',
  TRUE
);
```

Users see prices but can't book online. They call/WhatsApp instead.

### Scenario 3: Emergency - Disable All Online Booking

**Fleet issue, need to pause all bookings**

```sql
-- Create a long blackout period
INSERT INTO booking_blackout (start_date, end_date, reason, show_message, is_active)
VALUES (
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'Temporary suspension',
  'Online booking temporarily unavailable. Call +918445206116 for bookings.',
  TRUE
);
```

### Scenario 4: Change Main Summer Season Dates

**Start summer pricing earlier (May 1 instead of Apr 15)**

```sql
-- Find and update the main summer season
UPDATE seasons
SET start_date = '2025-05-01'
WHERE name = 'Season'
  AND description LIKE '%Summer%'
  AND priority = 10;
```

All bookings from May 1 onwards now use peak pricing!

---

## Benefits Recap

### ✅ Flexibility
- Add/remove peak periods anytime
- No need to recreate prices
- Long weekends handled easily

### ✅ Control
- Block online booking when needed
- Custom messages for blocked dates
- Show prices even when booking is blocked

### ✅ Simplicity
- Still only 2 price types (Off-Season, Season)
- Multiple "Season" periods all use same prices
- Priority system handles overlaps automatically

### ✅ Real Pricing
- All your actual packages
- All your actual rates
- Ready to use immediately

---

## Migration from Previous Version

If you were using `schema_final.sql` and `seed_final.sql`:

### What Changed?

1. **Seasons table**: Now allows multiple rows with same `name`
2. **Added**: `priority` column to seasons
3. **Added**: `booking_blackout` table
4. **Updated**: 7 packages (was 5)
5. **Updated**: 56 pricing entries (was 40)
6. **Added**: Helper functions (`get_season_for_date`, `is_booking_allowed`, etc.)

### Migration Steps

1. **Backup current data** (if you have any):
   ```sql
   -- Via Supabase Dashboard: Database > Backups
   ```

2. **Run new schema**:
   ```sql
   -- Copy/paste supabase/schema_enhanced.sql in SQL Editor
   ```

3. **Run new seed data**:
   ```sql
   -- Copy/paste supabase/seed_enhanced.sql in SQL Editor
   ```

4. **Update frontend imports**:
   ```typescript
   // OLD
   import { getPrice } from '@/lib/supabase/queries_v2';

   // NEW
   import { getPrice } from '@/lib/supabase/queries_enhanced';
   ```

---

## Quick Reference

### Database Tables

```
Core Tables:
- packages (7 packages)
- pricing (56 entries: 7 packages × 4 vehicles × 2 seasons)
- seasons (multiple periods, priority-based)
- booking_blackout (NEW - block online booking)
- vehicles (10 across 4 categories)
- bookings
- availability
```

### Helper Functions

```sql
-- Get season for a date (considers priority)
SELECT get_season_for_date('2025-05-20');

-- Check if booking is allowed (checks blackout)
SELECT is_booking_allowed('2025-01-25');

-- Get blackout message
SELECT get_blackout_message('2025-01-25');
```

### Frontend Functions

```typescript
// queries_enhanced.ts
getSeasonForDate(date)
isBookingAllowed(date)
getPrice(packageId, vehicleType, date)
getPackagePrices(packageId, date)
checkAvailability(date)
createBooking(bookingData)
getSeasonPeriods()
getBlackoutPeriods()
```

---

## Need Help?

- **Schema**: See `supabase/schema_enhanced.sql`
- **Sample Data**: See `supabase/seed_enhanced.sql`
- **Frontend Code**: See `src/lib/supabase/queries_enhanced.ts`
- **Full Guide**: This file (ENHANCED_FEATURES.md)

---

**Your enhanced pricing system is ready! 🚀**

**Next step:** Run the SQL files in Supabase and update your frontend imports!
