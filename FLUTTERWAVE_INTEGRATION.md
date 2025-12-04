# Flutterwave Integration Guide

## Overview
This document describes the complete Flutterwave payment integration for TKB Glow, including server-side payment initialization, refunds, and frontend modal/redirect flows.

## Environment Configuration

### Server (`server/.env`)
```dotenv
FLUTTERWAVE_SECRET=FLWSECK_TEST-6c48b1917b33bbed585c8768185900f5-X
```
⚠️ **Important:** Replace with your actual secret from Flutterwave dashboard. This is a TEST key and will not work for real payments.

### Frontend (`.env`)
```dotenv
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-984734524206ddb29f090c7bec222d50-X
```
⚠️ **Important:** Replace with your actual public key from Flutterwave dashboard.

## Server-Side Implementation

### 1. Flutterwave Helper Library (`server/lib/flutterwave.js`)

The helper module provides three main functions:

#### `initPayment(options)`
Initializes a payment with Flutterwave API.

**Parameters:**
- `tx_ref` (string): Unique transaction reference (e.g., `FLW-<order-id>`)
- `amount` (number): Payment amount in base currency
- `currency` (string): Currency code (default: `'NGN'`)
- `customer` (object): Customer details
  - `email` (string): Customer email
  - `name` (string): Customer name
  - `phone_number` (string, optional): Customer phone
  - `id` (string, optional): Customer ID
- `redirect_url` (string): URL to redirect after payment
- `customizations` (object, optional): Payment UI customizations
  - `title` (string): Payment page title
  - `description` (string): Payment description

**Returns:**
```javascript
{
  link: "https://checkout.flutterwave.com/...",  // Hosted checkout URL
  id: "...",                                      // Payment ID
  checkout_url: "...",                            // Alternative checkout URL
  // ... other Flutterwave response fields
}
```

**Example:**
```javascript
const { initPayment } = require('./lib/flutterwave');

const paymentData = await initPayment({
  tx_ref: `FLW-${order.id}`,
  amount: 50000,
  currency: 'NGN',
  customer: {
    email: 'customer@example.com',
    name: 'John Doe',
    phone_number: '+234803456789'
  },
  redirect_url: 'https://app.example.com/checkout/success',
  customizations: {
    title: 'TKB Glow Order',
    description: 'Payment for order #12345'
  }
});
```

#### `verifyPayment(transactionId)`
Verifies a completed payment with Flutterwave.

**Parameters:**
- `transactionId` (string): Flutterwave transaction ID

**Returns:**
Payment details including status, amount, customer info, etc.

#### `refundPayment(transactionId, amount)`
Initiates a refund for a completed payment.

**Parameters:**
- `transactionId` (string): Flutterwave transaction ID
- `amount` (number, optional): Partial refund amount (omit for full refund)

**Returns:**
Refund response with status and details.

### 2. Order Creation Endpoint (`server/routes/orders.js`)

The `/api/orders/create` endpoint now supports Flutterwave:

**Request:**
```javascript
POST /api/orders/create
Content-Type: application/json

{
  cart: [...],
  delivery: { address: {...}, lat, lng },
  delivery_charge: 500,
  client_total: 50500,
  payment_provider: 'flutterwave',
  userId: '...',
  email: 'customer@example.com',
  promo_code: 'PROMO10',
  discount_amount: 5000
}
```

**Response:**
```javascript
{
  orderId: 'uuid-...',
  flutterwave: {
    link: "https://checkout.flutterwave.com/...",
    id: "transaction_id",
    // ... other response data
  }
}
```

**Server Flow:**
1. Creates order in pending state
2. Calls `initPayment()` with order details
3. Stores payment provider reference (for refunds)
4. Returns payment data to client

**Error Handling:**
- If `FLUTTERWAVE_SECRET` not configured: `500` error "Missing FLUTTERWAVE_SECRET"
- If Flutterwave API fails: `500` error with detailed message (includes Flutterwave error response)
- Server logs all details for debugging (see "Debugging" section)

### 3. Admin Refund Endpoint (`server/routes/admin.js`)

The `POST /api/admin/orders/:id/refund` endpoint handles Flutterwave refunds:

**Request:**
```javascript
POST /api/admin/orders/:id/refund
x-admin-secret: <admin-secret>
Content-Type: application/json

{
  provider_ref: "transaction_id",  // optional, uses stored ref if not provided
  amount: 25000                      // optional, full refund if not provided
}
```

**Response (Success):**
```javascript
{
  ok: true,
  order: { ...updated order with status: 'refunded' },
  refund: { status: 'success', ... }
}
```

**Response (No Provider Ref):**
```javascript
{
  ok: true,
  order: { ...updated order with status: 'refunded' },
  refund: { status: 'marked_refunded' }  // No API call made
}
```

**Audit Logging:**
All refunds are logged to `admin_audit` table with:
- admin user ID (from header)
- action: `'order_refund'`
- details: `{ orderId, provider, providerRef, refundResult }`

### 4. Admin Test Endpoint (`server/routes/admin.js`)

For testing/debugging Flutterwave configuration:

**Request:**
```javascript
GET /api/admin/test-flutterwave
x-admin-secret: <admin-secret>
```

**Response (Working):**
```javascript
{
  ok: true,
  status: 'Flutterwave integration working',
  data: { ... actual payment data from test API call ... }
}
```

**Response (Error):**
```javascript
{
  ok: false,
  status: 'Flutterwave test failed',
  error: 'Flutterwave init failed: ...',
  details: { ... Flutterwave API response ... }
}
```

## Frontend Implementation

### 1. Checkout Payment Page (`src/pages/CheckoutPayment.tsx`)

#### Payment Method Selection
User selects Paystack or Flutterwave:
```typescript
const [selectedProvider, setSelectedProvider] = useState("paystack");
```

#### Flutterwave Handler
The `handleFlutterwave()` function:

1. **Creates order on server:**
   - Sends cart, delivery, promo info
   - Sets `payment_provider: 'flutterwave'`
   - Gets back `flutterwave` data (with link/checkout_url)

2. **Tries inline modal (if public key configured):**
   - Loads Flutterwave script
   - Calls `window.FlutterwaveCheckout()` with order details
   - User enters payment details in modal
   - On success: redirects to `/checkout/success?provider=flutterwave&transaction_id=...`
   - On close: shows toast notification

3. **Falls back to hosted link:**
   - If inline modal unavailable or disabled
   - Redirects to `flutterwave.link` returned by server
   - User completes payment on Flutterwave hosted checkout
   - Auto-redirects back after payment

**Code Structure:**
```typescript
const handleFlutterwave = async () => {
  // 1. Call /api/orders/create with payment_provider: 'flutterwave'
  const resp = await fetch(`${VITE_SERVER_URL}/api/orders/create`, {
    method: 'POST',
    body: JSON.stringify({
      cart,
      delivery,
      payment_provider: 'flutterwave',
      // ... other fields
    })
  });
  
  const data = await resp.json();
  const flutterwave = data.flutterwave;  // Contains link, id, etc.
  
  // 2. Try inline modal
  if (FwAPI && publicKey) {
    window.FlutterwaveCheckout({
      public_key: publicKey,
      tx_ref: `FLW-${data.orderId}`,
      amount: grandTotal,
      currency: 'NGN',
      customer: { email, phone_number, name },
      callback: (response) => {
        // Payment completed, get transaction ID from response
        navigate(`/checkout/success?orderId=${data.orderId}&provider=flutterwave`);
      },
      onclose: () => toast('Payment closed')
    });
  }
  
  // 3. Fall back to hosted link
  else if (flutterwave.link) {
    window.location.href = flutterwave.link;
  }
};
```

### 2. Error Handling

**Frontend Logs:**
```javascript
[CheckoutPayment] Order creation failed: <error message>
[CheckoutPayment] No flutterwave data in response: <response>
[CheckoutPayment] Flutterwave data received: {...}
[CheckoutPayment] Opening inline Flutterwave modal
```

**User Feedback:**
- Server errors displayed as toasts: "Failed to create order"
- No Flutterwave data: "Flutterwave init failed: server returned no payment data"
- Network errors caught and displayed

## Startup Validation

When the server starts, it automatically checks:

```
✓ [flutterwave] FLUTTERWAVE_SECRET is configured
```

If missing:
```
❌ [flutterwave] FLUTTERWAVE_SECRET is not set in server/.env
⚠️  Flutterwave payments will not work until FLUTTERWAVE_SECRET is set in server/.env
```

## Debugging

### 1. Server Logs

When a Flutterwave payment is initiated, watch for these logs:

```
[orders#create] Calling Flutterwave initPayment for order: <order_id>
[flutterwave#init] Initializing payment with tx_ref: FLW-<order_id> amount: 50000 currency: NGN
[flutterwave#init] Sending payload: {...}
[flutterwave#init] Response status: 200 body: {...}
[flutterwave#init] Success, returning data
[orders#create] Flutterwave response received, fwData: {...}
[orders#create] Returning flutterwave data to client
```

### 2. Troubleshooting

#### "Flutterwave init failed: invalid authorization key"
- **Cause:** Wrong `FLUTTERWAVE_SECRET` or invalid format
- **Fix:** Verify secret in `server/.env` from Flutterwave dashboard
- **Test:** Run `/api/admin/test-flutterwave` endpoint

#### "Flutterwave init failed: request failed"
- **Cause:** Network/API error, check server logs for full response
- **Fix:** Verify internet connection, check Flutterwave service status
- **Debug:** Look for `[flutterwave#init] Response status:` in logs

#### "No flutterwave data in response"
- **Cause:** Server did not return expected data structure
- **Fix:** Check that response has `flutterwave` field
- **Debug:** Check `/api/orders/create` response in browser DevTools

#### Inline modal not opening
- **Cause:** `VITE_FLUTTERWAVE_PUBLIC_KEY` not set or script not loaded
- **Fix:** Set `VITE_FLUTTERWAVE_PUBLIC_KEY` in `.env`, restart frontend
- **Fallback:** Code will redirect to hosted link instead

## Testing Checklist

- [ ] Server starts with ✓ Flutterwave validation message
- [ ] Admin test endpoint returns successful response: `/api/admin/test-flutterwave`
- [ ] Checkout with Flutterwave payment provider selected
- [ ] Payment initialization returns `flutterwave` data with valid link
- [ ] Inline modal opens (if public key configured) or redirect works
- [ ] Payment completion redirects to success page
- [ ] Order status updates to 'processing' or 'paid' (depending on webhook)
- [ ] Refund from admin works: order marked 'refunded', audit logged
- [ ] Error scenarios handled gracefully (missing keys, network errors)

## Production Deployment

1. **Update Environment Variables:**
   - `server/.env`: Set `FLUTTERWAVE_SECRET` to live secret
   - `.env`: Set `VITE_FLUTTERWAVE_PUBLIC_KEY` to live public key

2. **Verify Configuration:**
   - Run server and check for ✓ validation message
   - Test `/api/admin/test-flutterwave` endpoint
   - Do a test transaction (if available in Flutterwave sandbox)

3. **Webhook Setup (Optional but Recommended):**
   - Configure Flutterwave webhook to notify `/api/flutterwave/webhook`
   - Use webhook to mark orders as 'paid' automatically
   - Reduces reliance on polling/manual payment verification

## API Reference

### Flutterwave v3 Payments API
- **Endpoint:** `https://api.flutterwave.com/v3/payments`
- **Auth:** `Authorization: Bearer <FLUTTERWAVE_SECRET>`
- **Documentation:** https://developer.flutterwave.com/docs/payments/

### Required Fields in Payload
- `tx_ref` (string, unique per transaction)
- `amount` (number, base currency amount)
- `currency` (string, e.g., 'NGN')
- `redirect_url` (string, post-payment redirect)
- At least one of: `customer_email`, `customer_name`, `customer_phone`

### Optional Fields
- `meta` (object, additional metadata)
- `customization` (object, UI customization)

## Support

For issues with:
- **Flutterwave API errors:** Check `error.details` object in server logs
- **Integration bugs:** Check frontend `[CheckoutPayment]` console logs
- **Configuration:** Verify `FLUTTERWAVE_SECRET` and `VITE_FLUTTERWAVE_PUBLIC_KEY`
- **Flutterwave support:** https://support.flutterwave.com/

---

**Last Updated:** November 29, 2025  
**Version:** 1.0  
**Status:** Production Ready
