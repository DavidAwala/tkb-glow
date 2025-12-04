# TKB Glow - Complete Setup & Deployment Guide

This document covers all steps needed to fully set up and deploy the TKB Glow e-commerce application, including database migrations, environment variables, and feature verification.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Database Setup](#database-setup)
3. [Supabase Storage Setup](#supabase-storage-setup)
4. [Twilio Configuration](#twilio-configuration)
5. [Running the Application](#running-the-application)
6. [Feature Verification](#feature-verification)
7. [Troubleshooting](#troubleshooting)

---

## Environment Variables

### Frontend (`.env.local` in project root)

```env
VITE_SERVER_URL=http://localhost:3000
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key_here
```

### Backend (`server/.env`)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_UPLOADS_BUCKET=uploads

# Server Config
PORT=3000
CLIENT_ORIGIN=http://localhost:5173

# Payment Processing
PAYSTACK_SECRET=your_paystack_secret_key_here

# Twilio WhatsApp Integration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155552671
ADMIN_PHONE=whatsapp:+2348000000000
```

> **Note:** 
> - Replace placeholders with actual credentials from Paystack, Twilio, and Supabase dashboards
> - Do NOT commit `.env` or `.env.local` files to git
> - For development, use Twilio Sandbox for WhatsApp (free testing)

---

## Database Setup

### Step 1: Apply Migrations

The project includes SQL migrations in `supabase/migrations/`. Apply them in order:

#### Via Supabase CLI:

```bash
supabase db push
```

#### OR via Supabase Dashboard SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy & paste the contents of each migration file in order:
   - `20251124194239_586e1c0e-6766-427f-a2e8-5af2804d3603.sql` (initial schema)
   - `20251126120000_add_delivery_and_benefits.sql` (delivery tables & product fields)
   - `20251126130000_add_delivery_charge_to_orders.sql` (delivery charge to orders)

### Step 2: Verify Tables Created

After migrations, verify these tables exist:
- `products` (with `short_description` and `benefits` columns)
- `orders` (with `delivery_charge` column)
- `order_items`
- `profiles`
- `user_roles`
- `delivery_drivers` (new)
- `delivery_charges` (new)
- `reviews`

### Step 3: Seed Initial Data (Optional)

The migrations include seed data for:
- **Delivery Charges:** Port Harcourt (₦0), Rivers State (₦500), Other States (₦1500)
- **Delivery Drivers:** One default driver account

To add more, use the admin dashboard or direct SQL inserts.

---

## Supabase Storage Setup

### Step 1: Create `uploads` Bucket

1. Go to Supabase Dashboard → Storage → Buckets
2. Click "Create Bucket"
3. Set **Name:** `uploads`
4. Choose **Public** (recommended for simplicity) or **Private** (with signed URLs)

### Step 2: Configure CORS (if needed)

If bucket is public and frontend needs direct access:

1. Go to Supabase → Storage → Buckets → Select `uploads`
2. Configure CORS for your client origin (e.g., `http://localhost:5173`)

### Step 3: Verify Access

Test upload from server:

```bash
cd server
npm install
node -e "
const { supabase } = require('./lib/supabase');
(async () => {
  const buf = Buffer.from('test');
  const res = await supabase.storage.from('uploads').upload('test.txt', buf);
  console.log(res);
})();
"
```

---

## Twilio Configuration

### Step 1: Set Up Twilio Account

1. Create account at [twilio.com](https://twilio.com)
2. Get Account SID and Auth Token from Twilio Console

### Step 2: Enable WhatsApp Sandbox (for testing)

1. Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Accept the sandbox terms
3. Note your `TWILIO_WHATSAPP_FROM` number (e.g., `whatsapp:+14155552671`)

### Step 3: Add Your Phone Number

1. Send `join <join-code>` from your phone to the sandbox number
2. You'll receive a confirmation

### Step 4: Configure Webhook

1. Go to Twilio Console → Phone Numbers → Manage Numbers → Your WhatsApp number
2. Under "Messaging," set **Webhook URL:** 
   ```
   http://your-server.com/api/twilio/webhook
   ```
   (For local testing, use ngrok to tunnel: `ngrok http 3000`)

### Step 5: Update `.env`

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155552671
ADMIN_PHONE=whatsapp:+YOUR_PHONE_NUMBER
```

---

## Running the Application

### Development Mode

**Terminal 1: Frontend**

```bash
npm install
npm run dev
# App runs at http://localhost:5173
```

**Terminal 2: Backend Server**

```bash
cd server
npm install
node index.js
# Server runs at http://localhost:3000
```

### Production Mode

- Build frontend: `npm run build`
- Deploy frontend (Vercel, Netlify, etc.)
- Deploy backend (Railway, Heroku, AWS, etc.)
- Update `VITE_SERVER_URL` and webhook URLs in Twilio console

---

## Feature Verification

### Checkout Flow

1. **Add items to cart** and proceed to checkout
2. **Enter delivery address** (ensure state is included)
3. **Review order summary** with delivery charge breakdown:
   - Subtotal (items)
   - Delivery Charge (auto-calculated based on state)
   - **Total**
4. **Select payment method** (Paystack/Manual)
5. **Complete payment** → Order created and admin notified via WhatsApp

**Expected WhatsApp message to admin:**
```
Order #xyz created!
Customer: name@example.com
Items: 2 items
Total: ₦5,000
Delivery: Rivers - Port Harcourt
```

### Admin Dashboard

1. **Log in as admin** (user with `admin` role in `user_roles` table)
2. **Navigate to Admin** → Verify dashboard loads without errors
3. **Products Tab:**
   - Create product with title, SKU, price, short_description, benefits
   - Edit & delete products
   - View low-stock alerts

4. **Orders Tab:**
   - View all orders with customer info, items, and total
   - Click order to see details
   - Update status (Pending → Processing → Shipped → Delivered)
   - Verify status change triggers WhatsApp to admin

5. **Delivery Tab:**
   - **Drivers:** Add driver (name, phone, WhatsApp, vehicle)
   - **Charges:** View, edit, and add delivery charges by state/city
   - Verify charges match checkout amounts

### Twilio WhatsApp Bot

1. **From your phone, send message to sandbox number:**
   ```
   hello
   ```
   Expected: Admin receives message forwarded via WhatsApp

2. **From admin's phone, send image to bot:**
   - Upload an image to the bot
   - Expected: Bot processes image, uploads to Supabase `uploads` bucket, and returns a public URL
   - Copy URL and paste into "Product Create" form

3. **From server, test manual notification:**
   ```bash
   curl -X POST http://localhost:3000/api/orders/create \
     -H "Content-Type: application/json" \
     -d '{"cart":[{"id":"test","name":"Test","price":1000,"quantity":1}],"delivery":{},"email":"test@test.com"}'
   ```
   Expected: WhatsApp message to admin with order details

---

## Troubleshooting

### "Missing Supabase env vars"

**Solution:** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server/.env` are set correctly (no extra quotes).

### "Uploads bucket not found"

**Solution:** Create the `uploads` bucket in Supabase Storage (see [Supabase Storage Setup](#supabase-storage-setup)).

### "Delivery charge not applied"

**Solution:**
1. Verify `delivery_charges` table has entries for your state
2. Check frontend console for fetch errors
3. Verify `/api/delivery/charge` endpoint returns correct charge

### "Orders not showing in admin"

**Solution:**
1. Verify `ORDER_ITEMS` join is correct in query
2. Check browser console for GraphQL errors
3. Ensure authenticated user has orders in DB

### "Twilio messages not received"

**Solution:**
1. Verify `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `ADMIN_PHONE` are correct
2. Confirm webhook URL is reachable (use ngrok for local testing)
3. Check Twilio logs in console for delivery failures

### Port Already in Use

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in server/.env
PORT=3001
```

---

## Feature Checklist

- [ ] Database migrations applied successfully
- [ ] Supabase `uploads` bucket created
- [ ] Frontend loads without errors at `http://localhost:5173`
- [ ] Backend server runs at `http://localhost:3000`
- [ ] Checkout flow includes delivery charge calculation
- [ ] Admin dashboard loads (admin user role required)
- [ ] Product CRUD with short_description and benefits
- [ ] Orders display in admin with correct totals
- [ ] Delivery drivers and charges manageable from admin
- [ ] Twilio WhatsApp notifications working
- [ ] Image uploads via WhatsApp bot processed successfully

---

## Next Steps

- Configure production environment variables
- Set up SSL/TLS certificates
- Deploy frontend and backend
- Update webhook URLs for production Twilio
- Configure payment gateway for production
- Set up monitoring and logging
- Create backup strategy for database

---

For additional help, refer to:
- [Supabase Docs](https://supabase.com/docs)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Paystack Integration](https://paystack.com/docs)
