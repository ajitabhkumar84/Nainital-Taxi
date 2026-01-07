# Nainital Taxi - Data Layer Documentation

## 🗄️ Database Architecture

This directory contains the complete data layer architecture for the Nainital Taxi platform, built on **Supabase** (PostgreSQL).

## 📋 Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Schema Overview](#schema-overview)
3. [Key Features](#key-features)
4. [Business Logic](#business-logic)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)

---

## 🚀 Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `nainital-taxi`
   - Database Password: (Choose a strong password)
   - Region: Choose closest to India (e.g., Singapore)

### Step 2: Run the Schema

1. Open the Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `schema_enhanced.sql`
4. Paste and execute the SQL
5. Wait for confirmation (should create 13 tables + views)

### Step 3: Run Database Functions

1. In the same SQL Editor
2. Copy the contents of `functions.sql`
3. Paste and execute the SQL

### Step 4: Enable Row Level Security

1. Copy the contents of `enable_rls_with_policies.sql`
2. Paste and execute the SQL

### Step 5: Run the Seed Data

1. In the same SQL Editor
2. Copy the contents of `seed_enhanced.sql`
3. Paste and execute the SQL
4. Verify data insertion:
   ```sql
   SELECT COUNT(*) FROM vehicles;     -- Should return 10
   SELECT COUNT(*) FROM packages;     -- Should return 7
   SELECT COUNT(*) FROM destinations; -- Should return 6
   SELECT COUNT(*) FROM pricing;      -- Should return 28
   ```

### Step 6: Verify Connection

Run the development server and check console:
```bash
npm run dev
```

---

## 📊 Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **vehicles** | Fleet management | Retro Pop attributes (emoji, personality, color) |
| **packages** | Tour packages & transfers | Dynamic pricing multipliers |
| **destinations** | Tourist locations | SEO-optimized with rich content |
| **availability** | Daily fleet status | Auto-computed status (available/limited/sold_out) |
| **bookings** | Complete booking lifecycle | Status tracking with audit trail |
| **waitlist** | "Velvet Rope" logic | Priority-based queue for sold-out dates |
| **seasons** | Peak/off-peak pricing | Recurring seasonal multipliers |
| **reviews** | Customer testimonials | Moderation with featured flag |
| **profiles** | User accounts | Loyalty tiers & preferences |

### Supporting Tables

- **booking_status_history**: Audit trail for all status changes
- **admin_settings**: Configuration key-value store

---

## ✨ Key Features

### 1. **Velvet Rope Booking Logic**

When dates sell out, customers can join a priority-based waitlist:

```typescript
// Customer tries to book sold-out date
const availability = await checkAvailability('2025-06-15');

if (availability.status === 'sold_out') {
  // Offer waitlist option
  await addToWaitlist({
    customer_name: 'John Doe',
    desired_date: '2025-06-15',
    package_id: pkg.id,
    vehicle_type: 'suv',
    passengers: 4,
    estimated_price: 3500,
  });
}
```

**Features:**
- VIP customers get higher priority
- Auto-notification when spots open
- 24-hour expiry on waitlist spots
- Automatic conversion to bookings

### 2. **Dynamic Pricing Engine**

Prices adjust based on:
- **Vehicle type**: Sedan (1x), SUV (1.4x), Tempo (2.2x), Luxury (1.8x)
- **Season**: Peak periods add 30-50% (Diwali, Summer, New Year)
- **Package**: Each tour/transfer has a base price

```typescript
const pricing = await calculatePrice(
  packageId: 'uuid-here',
  vehicleType: 'suv',
  date: '2025-06-20' // Peak summer
);

// Returns:
// {
//   base_price: 2000,
//   vehicle_multiplier: 1.4,
//   season_multiplier: 1.3,
//   final_price: 3640,
//   breakdown: { ... }
// }
```

### 3. **Availability Management**

Three-tier availability status:

| Status | Condition | UI Action |
|--------|-----------|-----------|
| 🟢 **Available** | 3+ cars free | Normal "Book Now" button |
| 🟡 **Limited** | 1-2 cars free | Urgency message: "Only 2 left!" |
| 🔴 **Sold Out** | 0 cars free | "Join Waitlist" + "Contact WhatsApp" |

**Auto-computed** - Status updates automatically when bookings change:

```sql
-- Trigger updates status on every availability change
CREATE TRIGGER set_availability_status
  BEFORE INSERT OR UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION update_availability_status();
```

### 4. **Retro Pop Fleet Aesthetic**

Each vehicle has personality attributes for marketing:

```typescript
{
  name: "Sunshine Express 🌞",
  nickname: "Sunny",
  emoji: "🚕",
  primary_color: "Sunshine Yellow",
  color_hex: "#FFD93D",
  personality_trait: "Cheerful & Energetic",
  tagline: "Your vacation wingman!"
}
```

### 5. **Booking Lifecycle**

Complete status flow with audit trail:

```
pending → payment_pending → confirmed → in_progress → completed
                      ↓
                  cancelled / refunded
```

Every status change is logged in `booking_status_history` with timestamp and reason.

---

## 🧠 Business Logic

### Price Calculation Formula

```
Final Price = Base Price × Vehicle Multiplier × Season Multiplier
```

**Example: Nainital Darshan in Peak Summer with SUV**
```
₹2,000 (base) × 1.4 (SUV) × 1.3 (summer) = ₹3,640
```

### Availability Status Logic

```typescript
if (is_blocked) status = 'blocked';
else if (cars_available >= 3) status = 'available';
else if (cars_available > 0) status = 'limited';
else status = 'sold_out';
```

### Waitlist Priority

1. **VIP customers** (is_vip = true)
2. **Priority number** (lower = higher)
3. **First-come-first-served** (created_at)

---

## 💻 Usage Examples

### Frontend: Display Available Packages

```typescript
import { getPopularPackages } from '@/lib/supabase';

export default async function HomePage() {
  const packages = await getPopularPackages();

  return (
    <div>
      {packages.map(pkg => (
        <PackageCard key={pkg.id} package={pkg} />
      ))}
    </div>
  );
}
```

### Check Date Availability

```typescript
import { checkAvailability } from '@/lib/supabase';

const handleDateSelect = async (date: string) => {
  const result = await checkAvailability(date);

  if (result.is_available) {
    // Show "Book Now" button
    setAvailableMessage(result.message);
  } else {
    // Show "Sold Out" or "Join Waitlist"
    setShowWaitlist(true);
  }
};
```

### Create a Booking

```typescript
import { createBooking, calculatePrice } from '@/lib/supabase';

const handleBooking = async () => {
  // Calculate price first
  const pricing = await calculatePrice(packageId, vehicleType, date);

  // Create booking
  const booking = await createBooking({
    customer_name: formData.name,
    customer_phone: formData.phone,
    customer_email: formData.email,
    package_id: packageId,
    package_name: packageName,
    vehicle_type: vehicleType,
    booking_date: date,
    pickup_time: time,
    pickup_location: formData.location,
    passengers: formData.passengers,
    base_price: pricing.base_price,
    vehicle_multiplier: pricing.vehicle_multiplier,
    season_multiplier: pricing.season_multiplier,
    final_price: pricing.final_price,
  });

  // Redirect to payment page
  router.push(`/booking/${booking.id}/payment`);
};
```

### Display Reviews

```typescript
import { getFeaturedReviews } from '@/lib/supabase';

export default async function TestimonialsSection() {
  const reviews = await getFeaturedReviews(6);

  return (
    <div className="grid grid-cols-3 gap-6">
      {reviews.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
```

---

## 📚 API Reference

### Query Functions

All functions are available via `@/lib/supabase`:

#### Packages
- `getPackages(type?)` - Get all active packages
- `getPackageBySlug(slug)` - Get single package
- `getPopularPackages()` - Get featured packages

#### Vehicles
- `getVehicles(type?)` - Get all active vehicles
- `getFeaturedVehicles()` - Get homepage vehicles

#### Pricing
- `calculatePrice(packageId, vehicleType, date)` - Calculate final price

#### Availability
- `checkAvailability(date)` - Check single date
- `getUpcomingAvailability()` - Get next 30 days
- `getAvailabilityRange(start, end)` - Get date range

#### Bookings
- `createBooking(data)` - Create new booking
- `getUserBookings(userId)` - Get user's bookings
- `getBooking(id)` - Get single booking
- `updateBookingStatus(id, status)` - Update status

#### Waitlist
- `addToWaitlist(data)` - Join waitlist
- `getWaitlistForDate(date)` - Get waitlist entries

#### Reviews
- `getFeaturedReviews(limit)` - Get homepage reviews
- `getApprovedReviews()` - Get all approved reviews

#### Destinations
- `getDestinations()` - Get all destinations
- `getPopularDestinations()` - Get popular destinations
- `getDestinationBySlug(slug)` - Get single destination

---

## 🔒 Security (Row Level Security)

RLS policies ensure data security:

✅ **Public read** on vehicles, packages, destinations, availability
✅ **User-scoped** access to profiles and bookings
✅ **Admin-only** access to sensitive operations

Example RLS policy:
```sql
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🛠️ Database Functions

### Triggers

- **Auto-update timestamps**: `updated_at` field on all tables
- **Auto-compute status**: Availability status based on cars_available
- **Auto-log changes**: Booking status changes tracked in history
- **Auto-update stats**: User total_bookings and total_spent

### Views

- `active_vehicles_summary` - Fleet statistics by type
- `upcoming_bookings` - All confirmed future bookings
- `availability_calendar` - 90-day availability view

---

## 📞 Support

For issues or questions:
- Check the master plan: `master-plan.md`
- Review SQL comments in `schema_enhanced.sql`
- Contact: Database Architect

---

**Built with ❤️ for Nainital Taxi**
