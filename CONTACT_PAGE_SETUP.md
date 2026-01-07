# Contact Page Setup Guide

## Overview
A complete contact page has been created for Nainital Taxi, inspired by the kathgodamtaxi design but adapted to match your vibrant retro pop theme.

## Page URL
**http://localhost:3000/contact**

## Components Created

### 1. ContactHero (`src/components/contact/ContactHero.tsx`)
- Eye-catching hero section with dark background
- Animated decorative floating elements (sunshine, teal, coral)
- Trust badges: "24/7 Available", "Instant Response", "Free Quote"
- Fully responsive design

### 2. ContactForm (`src/components/contact/ContactForm.tsx`)
- **Web3Forms Integration** for email submissions
- Three sections:
  - **Your Information**: Name, Phone, Email
  - **Trip Details**: Pickup, Drop, Date, Time
  - **Vehicle & Passengers**: Passenger count, Vehicle type
- **Dual submission options**:
  - Submit via Web3Forms (email)
  - Send via WhatsApp (pre-filled message)
- Success/Error message handling
- Retro-styled with shadow effects and borders

### 3. ContactInfo (`src/components/contact/ContactInfo.tsx`)
- **Four interactive contact cards**:
  - WhatsApp (clickable, opens WhatsApp chat)
  - Phone (clickable, initiates call)
  - Email (clickable, opens email client)
  - Address (static display)
- **Google Maps Integration**:
  - Embedded map iframe
  - "Open in Google Maps" button
- **Operating Hours Section**:
  - 24/7 Available
  - 365 Days a Year
  - Instant Booking

### 4. ContactFAQ (`src/components/contact/ContactFAQ.tsx`)
- 10 frequently asked questions
- Accordion-style expandable answers
- Questions include:
  - Booking methods
  - Operating hours
  - Cancellation policy
  - Payment methods
  - Driver verification
  - Airport/station pickups
  - Vehicle requests
  - Special requirements
  - Fare calculation
  - Multi-day tours
- "Still Have Questions?" CTA with WhatsApp and Phone buttons

### 5. Main Contact Page (`src/app/contact/page.tsx`)
- Combines all components
- Includes Header and Footer
- FloatingWhatsApp button
- Bottom CTA section with:
  - "Ready to Book Your Journey?" heading
  - Links to Fleet and Home pages
  - Trust badges (Verified Drivers, Zero Alcohol Policy, 10,000+ Safe Trips)

## Configuration Required

### 1. Web3Forms Access Key (REQUIRED)
**File**: `src/components/contact/ContactForm.tsx:71`

**Current**:
```tsx
<input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY_HERE" />
```

**Action Required**:
1. Visit https://web3forms.com
2. Sign up for a free account
3. Get your access key
4. Replace `YOUR_WEB3FORMS_ACCESS_KEY_HERE` with your actual key

### 2. Google Maps URL (OPTIONAL)
**Files**:
- `src/components/contact/ContactInfo.tsx` (default parameter)
- `src/app/contact/page.tsx:53`

**Current**: Placeholder map URL

**Action Required**:
1. Go to Google Maps
2. Find your exact business location
3. Click "Share" → "Embed a map"
4. Copy the iframe URL
5. Replace the `mapUrl` parameter in the contact page

### 3. Office Address (OPTIONAL)
**File**: `src/app/contact/page.tsx:52`

**Current**: `"Nainital, Uttarakhand, India"`

**Action Required**:
Update with your actual office address for display on contact cards

## Contact Information Used

All contact information is pulled from your `.env.local`:

- **Phone**: +918445206116
- **WhatsApp**: +918445206116
- **Email**: taxinainital@gmail.com

These are hard-coded in the contact page but can be made dynamic if needed.

## Design Features

### Retro Pop Theme
- **Colors**: Sunshine yellow, Teal blue, Coral red, Ink black
- **Fonts**: Chewy (display), Nunito (body)
- **Effects**:
  - Retro shadows (`shadow-retro`, `shadow-retro-lg`)
  - 3px borders (`border-3`)
  - Rounded corners (`rounded-2xl`, `rounded-3xl`)
  - Hover animations (scale, translate)
  - Glassmorphism elements

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg
- Stacked layout on mobile
- Side-by-side on desktop

## Testing Checklist

- [ ] Visit http://localhost:3000/contact
- [ ] Test form submission (after adding Web3Forms key)
- [ ] Click "Send via WhatsApp" button
- [ ] Click WhatsApp contact card
- [ ] Click Phone contact card
- [ ] Click Email contact card
- [ ] Test FAQ accordion (click to expand/collapse)
- [ ] Click "Still Have Questions?" WhatsApp button
- [ ] Click "Still Have Questions?" Phone button
- [ ] Test on mobile device/responsive view
- [ ] Verify all links work
- [ ] Check FloatingWhatsApp button

## Next Steps

1. **Get Web3Forms Access Key** (highest priority)
   - Visit https://web3forms.com
   - Create free account
   - Copy access key
   - Update `ContactForm.tsx`

2. **Update Google Maps** (recommended)
   - Add your actual business location
   - Update embed URL

3. **Update Address** (recommended)
   - Add complete office address

4. **Test Form Submission**
   - Fill out form
   - Submit
   - Check your email for form submission

5. **Add to Navigation** (if needed)
   - Add "Contact" link to Header
   - Add "Contact" link to Footer

## File Structure

```
src/
├── app/
│   └── contact/
│       └── page.tsx              # Main contact page
├── components/
│   ├── contact/
│   │   ├── ContactHero.tsx       # Hero section
│   │   ├── ContactForm.tsx       # Contact form with Web3Forms
│   │   ├── ContactInfo.tsx       # Contact cards + map
│   │   ├── ContactFAQ.tsx        # FAQ accordion
│   │   └── index.ts              # Export all components
│   ├── ui/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Button.tsx
│   └── FloatingWhatsApp.tsx
```

## Notes

- Form uses Web3Forms API (free tier: 250 submissions/month)
- WhatsApp integration uses direct `wa.me` links
- All form data is pre-filled into WhatsApp message when clicking "Send via WhatsApp"
- FAQ accordion only allows one item open at a time
- Google Maps embed requires internet connection
- All external links open in new tab (`target="_blank"`)

## Support

If you need to make changes:
- **Colors**: Edit `tailwind.config.ts`
- **Contact Info**: Edit `src/app/contact/page.tsx` or make it dynamic
- **FAQs**: Edit `src/components/contact/ContactFAQ.tsx` array
- **Form Fields**: Edit `src/components/contact/ContactForm.tsx`

---

**Created**: December 31, 2025
**Status**: ✅ Complete (needs Web3Forms key to be functional)
