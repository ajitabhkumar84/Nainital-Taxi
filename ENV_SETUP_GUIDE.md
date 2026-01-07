# 🔐 Environment Variables Setup Guide

This guide will help you configure all environment variables needed for production.

## 🚨 Quick Start (Minimum Required)

To get the app running, you MUST configure these variables:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_PASSWORD=your_secure_password
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 📋 Step-by-Step Configuration

### 1️⃣ Supabase Setup (REQUIRED)

**What it does:** Database for all your data (bookings, packages, vehicles, etc.)

**Where to get:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the values:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://pjdseqinttikdjowaytg.supabase.co

# Project API keys → anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Project API keys → service_role (secret!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**⚠️ Security Note:**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Safe to expose (has RLS restrictions)
- `SUPABASE_SERVICE_ROLE_KEY` → NEVER expose to client (bypasses RLS)

---

### 2️⃣ Admin Password (REQUIRED)

**What it does:** Protects your admin panel

**Setup:**
```bash
# Choose a strong password (minimum 12 characters)
ADMIN_PASSWORD=MySecureP@ssw0rd2024!
```

**🔒 Security Rules:**
- ❌ DO NOT use `NEXT_PUBLIC_ADMIN_PASSWORD`
- ✅ DO use `ADMIN_PASSWORD` (server-side only)
- Use a password manager to generate strong passwords
- Change from default "nainital2024"

**Why?** Variables with `NEXT_PUBLIC_` are embedded in the browser bundle and visible to anyone. Admin credentials must be server-side only.

---

### 3️⃣ Email Service - Resend (REQUIRED for bookings)

**What it does:** Sends booking confirmations to customers and admin

**Where to get:**
1. Sign up at [Resend.com](https://resend.com)
2. Free tier: 3,000 emails/month, 100/day (sufficient to start)
3. Go to **API Keys** → Create new key

```bash
RESEND_API_KEY=re_123abc456def
```

**Email addresses:**
```bash
# Who emails come from (must verify domain or use resend.dev)
FROM_EMAIL=bookings@nainitaltaxi.in

# Where admin notifications go
ADMIN_EMAIL=admin@nainitaltaxi.in
```

**Domain Verification:**
- **Option 1 (Recommended):** Verify your domain in Resend
  - Go to **Domains** → Add Domain → Follow DNS setup
  - Add SPF, DKIM records to your domain DNS

- **Option 2 (Testing):** Use `onboarding@resend.dev` for testing
  ```bash
  FROM_EMAIL=onboarding@resend.dev
  ```

---

### 4️⃣ Contact Form - Web3Forms (REQUIRED)

**What it does:** Handles contact form submissions

**Where to get:**
1. Go to [Web3Forms.com](https://web3forms.com)
2. Enter your email → Get Free Access Key
3. Copy the access key

```bash
NEXT_PUBLIC_WEB3FORMS_KEY=12345678-1234-1234-1234-123456789abc
```

**Why NEXT_PUBLIC?** Contact form runs in the browser, so this key is safe to be public.

**Cost:** FREE forever, unlimited submissions

---

### 5️⃣ Site URL (REQUIRED)

**What it does:** Used for generating absolute URLs in emails, redirects, etc.

```bash
# Development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production
NEXT_PUBLIC_SITE_URL=https://nainitaltaxi.in
```

**Note:** No trailing slash!

---

### 6️⃣ Business Information (Already Configured)

These are already in your `.env.local` and are correct:

```bash
NEXT_PUBLIC_BUSINESS_PHONE=+918445206116
NEXT_PUBLIC_BUSINESS_WHATSAPP=+918445206116
NEXT_PUBLIC_BUSINESS_EMAIL=taxinainital@gmail.com
NEXT_PUBLIC_UPI_ID=gokumaon@paytm
```

**Why NEXT_PUBLIC?** These are public-facing contact details displayed on the website.

---

## 🎯 Optional But Recommended

### Google Analytics 4 (Track visitors)

**Setup:**
1. Go to [Google Analytics](https://analytics.google.com)
2. Create property → Get Measurement ID

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Sentry (Error monitoring)

**Setup:**
1. Sign up at [Sentry.io](https://sentry.io)
2. Create project → Copy DSN

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/yyy
```

---

## 🔮 Future Integrations (Optional)

### Payment Gateway - Razorpay

**When:** Once you're ready to accept online payments

**Setup:**
1. Sign up at [Razorpay](https://razorpay.com)
2. Get Test/Live keys from Dashboard

```bash
# Test mode (for development)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Live mode (for production)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### Google Calendar Sync

**When:** To automatically block dates in your Google Calendar

**Setup:** Requires Google Cloud Platform project setup
- See detailed guide in [GOOGLE_CALENDAR_SETUP.md] (create if needed)

```bash
GOOGLE_CALENDAR_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=xxxxx
GOOGLE_CALENDAR_REFRESH_TOKEN=xxxxx
```

### WhatsApp Business API

**When:** For automated booking confirmations via WhatsApp

**Setup:** Requires Meta Business verification
```bash
WHATSAPP_BUSINESS_PHONE_ID=xxxxx
WHATSAPP_BUSINESS_TOKEN=xxxxx
```

**Alternative:** For now, you're using direct WhatsApp links (`wa.me`) which work great!

---

## ✅ Verification Checklist

After configuring environment variables:

```bash
# Test database connection
npm run dev
# Visit: http://localhost:3000/api/test-db
# Should return: { status: "success", ... }

# Test admin authentication
# Visit: http://localhost:3000/admin
# Enter your ADMIN_PASSWORD
# Should log in successfully

# Test email (after booking)
# Create a test booking
# Check if emails are received

# Test contact form
# Visit: http://localhost:3000/contact
# Submit form
# Check if email arrives at ADMIN_EMAIL
```

---

## 🔒 Security Best Practices

### DO ✅
- Keep `.env.local` in `.gitignore` (already configured)
- Use different passwords for dev and production
- Rotate API keys periodically
- Use service role key ONLY in API routes (server-side)
- Enable 2FA on all service accounts (Supabase, Resend, etc.)

### DON'T ❌
- Never commit `.env.local` to git
- Never use `NEXT_PUBLIC_` for secrets/passwords
- Never share service role keys
- Never hardcode API keys in code
- Never use same password across services

---

## 🚀 Production Deployment

When deploying to Vercel/Netlify/other:

1. **Set environment variables in hosting dashboard:**
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables

2. **Update these for production:**
   ```bash
   NEXT_PUBLIC_SITE_URL=https://nainitaltaxi.in
   ADMIN_PASSWORD=<strong_production_password>
   FROM_EMAIL=bookings@nainitaltaxi.in  # Verified domain
   ```

3. **Keep these the same:**
   - Supabase URLs (use production database)
   - API keys (or generate production keys)

4. **Enable in production:**
   - HTTPS only (automatic on Vercel/Netlify)
   - Secure cookies (automatic when `NODE_ENV=production`)
   - Email domain verification
   - Analytics tracking

---

## 🆘 Troubleshooting

### "Database connection failed"
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Ensure database schema is set up (see DATABASE_SETUP_GUIDE.md)

### "Admin login not working"
- Verify you changed `ADMIN_PASSWORD` in `.env.local`
- Restart dev server after changing `.env.local`
- Clear browser cookies for localhost

### "Emails not sending"
- Check `RESEND_API_KEY` is valid
- Verify email domain in Resend dashboard
- Use `onboarding@resend.dev` for testing
- Check Resend logs for errors

### "Contact form not working"
- Verify `NEXT_PUBLIC_WEB3FORMS_KEY`
- Check browser console for errors
- Test API key at web3forms.com

---

## 📞 Need Help?

**Environment variable not listed here?**
- Check `.env.example` for full list
- Most optional variables are for future features

**Still having issues?**
- Check service status pages (Supabase, Resend, etc.)
- Review error messages in browser console
- Check Next.js server logs

---

**Configuration complete!** 🎉

Your environment is now set up for development and ready for production deployment.
