# Twilio WhatsApp Integration Setup Guide

This guide explains how to set up WhatsApp notifications for the TKB admin system using Twilio.

## Overview

The system now sends WhatsApp notifications to the admin when:
- ✅ A new order is created
- ✅ An order status changes to "shipped" or "delivered"

## Step 1: Get Twilio Credentials

1. **Create a Twilio Account**
   - Visit https://www.twilio.com/console
   - Sign up for a free account

2. **Find Your Credentials**
   - Go to Console Dashboard
   - Copy your **Account SID**
   - Copy your **Auth Token**

3. **Set Up WhatsApp Sandbox**
   - Go to https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-sandbox
   - Follow the setup wizard
   - Send the indicated message from your WhatsApp to the provided number
   - You'll get a **Twilio WhatsApp Number** (sandbox number like `whatsapp:+14155552671`)

4. **Add Your Admin Phone**
   - In the same WhatsApp sandbox, add your admin's WhatsApp number
   - Format: `whatsapp:+2349000000000` (include country code)

## Step 2: Update Environment Variables

Edit `server/.env` and add:

```dotenv
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155552671
ADMIN_PHONE=whatsapp:+2349000000000
```

Replace:
- `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your Account SID
- `your_auth_token_here` with your Auth Token
- `whatsapp:+14155552671` with your Twilio WhatsApp sandbox number
- `whatsapp:+2349000000000` with your admin's WhatsApp number (with country code)

## Step 3: How It Works

### Order Creation Notification
When a customer places an order via the checkout page:
1. Order is created in the database
2. Automatic WhatsApp message sent to admin with:
   - Order ID
   - Customer email
   - Items purchased with quantities
   - Total amount
   - Order status

**Example message:**
```
📦 *NEW ORDER* #3f02da7d

👤 *Customer:* customer@example.com

🛒 *Items:*
• Premium Product x2 = ₦50,000
• Basic Item x1 = ₦10,000

💰 *Total:* ₦60,000

📍 *Status:* pending

⏰ *Time:* 11/26/2025, 2:30:45 PM
```

### Delivery Status Update Notification
When admin updates order status to "shipped" or "delivered":
1. Status is updated in database
2. WhatsApp notification sent to admin with:
   - Order ID
   - New status
   - Order amount
   - Delivery address
   - Update timestamp

**Example message:**
```
🚚 *DELIVERY UPDATE* #3f02da7d

📊 *New Status:* SHIPPED

💰 *Amount:* ₦60,000

📍 *Delivery Location:* 123 Lekki, Lagos

⏰ *Updated:* 11/26/2025, 3:15:20 PM
```

## Step 4: Testing

### Test Order Creation
1. Start both servers:
   ```bash
   # Terminal 1 - Server
   cd server
   npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

2. Navigate to the app and complete a checkout
3. Check your admin WhatsApp for a notification

### Test Delivery Notification
1. Open the Admin Dashboard (`/admin`)
2. Go to Orders tab
3. Click on an order to view details
4. Change the status to "Shipped" or "Delivered"
5. Check your admin WhatsApp for a notification

## Step 5: Production Setup

### Upgrade from Sandbox
To send messages to any WhatsApp number (not just sandbox):
1. Request production access at https://www.twilio.com/console/sms/whatsapp/learn
2. Wait for approval from Meta/Twilio (usually a few days)
3. Update credentials in production `.env`

### Production Credentials
Replace sandbox credentials with production ones:
```dotenv
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=prod_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
ADMIN_PHONE=whatsapp:+2349000000000
```

## Troubleshooting

### Messages Not Sending?

1. **Check Server Logs**
   ```bash
   # You should see logs like:
   # ✅ [Twilio] WhatsApp message sent: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **Verify Credentials**
   - Double-check all values in `server/.env`
   - No typos in phone numbers
   - Account SID and Auth Token are correct

3. **Sandbox Expiration**
   - Sandbox sessions expire after 72 hours of inactivity
   - You need to resend the activation message again
   - Or upgrade to production

4. **Development Mode**
   - If Twilio credentials are missing, messages are logged to console only
   - Check terminal output for: `📱 [Twilio] Message would be sent:`

### Phone Number Format Issues
- Always include country code: `whatsapp:+234` (Nigeria), `whatsapp:+1` (USA)
- Use format: `whatsapp:+[country_code][phone_number]`
- Example: `whatsapp:+2349012345678` (not `whatsapp:+09012345678`)

## API Endpoints

### Update Order Status (with WhatsApp notification)
```bash
PUT http://localhost:3000/api/orders/:id/status
Content-Type: application/json

{
  "status": "shipped"
}
```

Responses:
- `shipped` or `delivered` → WhatsApp notification sent to admin
- Other statuses → No notification sent

## Files Modified

- `server/.env` - Twilio credentials
- `server/lib/twilio.js` - Twilio utilities (new)
- `server/routes/orders.js` - Integration with order endpoints
- `src/pages/Admin.tsx` - Uses new PUT endpoint for status updates

## Support

For issues with Twilio:
- Twilio Docs: https://www.twilio.com/docs/whatsapp
- Twilio Support: https://www.twilio.com/help

For application issues:
- Check server logs for error messages
- Verify `.env` configuration
- Test with curl/Postman
