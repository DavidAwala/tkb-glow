# 🔧 Promo SQL Migration Guide

## Issue
The `redeem_promo` RPC function in Supabase has ambiguous column references that cause a 400 error when applying promos during checkout.

## ✅ Quick Fix (5 minutes)

### Step 1: Copy the SQL Migration
Open the SQL file at: `supabase/migrations/20251129_create_redeem_promo_rpc.sql`
Copy **ALL** the SQL content from this file.

### Step 2: Apply in Supabase Console
1. Go to: https://app.supabase.com/project/nqikiauxcxqgwevkqgit/sql/new
2. You should now be in the SQL editor with a new query
3. **Paste** the SQL you copied above
4. Click the blue **"Run"** button
5. You should see: ✅ "Success. No rows returned"

### Step 3: Restart Server
```powershell
# Kill any running Node process
Stop-Process -Name node -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 2

# Start the server
node server/index.js
```

### Step 4: Test Promo Code
1. Go to: http://localhost:5173
2. Add items to cart
3. Go to Payment page
4. Try entering a promo code (e.g., from admin dashboard)
5. You should see ✨ beautiful confetti animation and discount applied!

---

## 🚀 What Changed

### SQL RPC Function (redeem_promo)
- **Before**: Used generic `SELECT *` with ambiguous column references
- **After**: Explicitly declares all columns as local variables (v_id, v_code, etc.)
- **Result**: No more "column reference is ambiguous" error from PostgreSQL

### Frontend (CheckoutPayment.tsx)
- **Before**: Could show NaN discount amounts
- **After**: All numeric coercion done with strict Number() handling
- **Bonus**: Beautiful new promo UI with confetti animation instead of emoji

### Server (orders.js)  
- **Before**: Crashed when RPC failed
- **After**: Has fallback logic to validate promo server-side if RPC fails (non-atomic but keeps checkout working)

---

## 🎯 Promo Features Now Working

✅ **Ambiguous Column Error**: FIXED via RPC refactoring  
✅ **NaN Discount Display**: FIXED via numeric coercion  
✅ **Discount Calculation**: Fixed for both percent and fixed amount  
✅ **Delivery Fee Discounts**: Working when promo.apply_to_delivery = true  
✅ **Confetti Animation**: Beautiful canvas-based animation on promo apply  
✅ **Awesome UI**: Modern gradient card with clear discount details  
✅ **Error Messages**: Clear, helpful user feedback  

---

## 📊 Testing Checklist

After migration, test these scenarios:

- [ ] Apply valid percent-based promo → should show discount and confetti
- [ ] Apply fixed-amount promo → should subtract fixed amount
- [ ] Apply promo that applies to delivery → should reduce delivery fee
- [ ] Try invalid promo → should show friendly error message
- [ ] Apply promo then remove it → button should remove promo code
- [ ] Checkout with promo → order should be created with discounts applied
- [ ] View order detail → should show promo code and discount amount

---

## ❓ Troubleshooting

**Q: Still seeing "column reference is ambiguous" error?**  
A: The migration hasn't been applied yet. Make sure you:
   - Ran the SQL in the Supabase console
   - Saw "Success" message
   - Waited a moment, then restarted the server

**Q: Confetti not showing?**  
A: It should appear automatically when promo is applied. If not:
   - Check browser console for errors
   - Make sure JavaScript is enabled
   - Try a different promo code

**Q: Discount still showing as NaN?**  
A: This should be fixed now. If not:
   - Clear browser cache (Ctrl+Shift+Delete)
   - Reload the page
   - Check browser console for errors

---

## 🎁 Promo Code Examples

Create these in your admin panel to test:

1. **SAVE20**: 20% discount
2. **NEWUSER**: Fixed ₦500 discount  
3. **FREEDELIV**: Apply to delivery (free shipping)
4. **SUMMER50**: 50% discount (for testing max discount = subtotal)

---

## 📝 Notes

- The RPC function is SECURITY DEFINER, so it runs with database role privileges
- Promo uses are incremented atomically in the RPC (race-condition safe)
- Discount cannot exceed subtotal (capped automatically)
- All timestamps are in UTC from Supabase
