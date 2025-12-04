# 🧪 PROMO SYSTEM - MANUAL TEST GUIDE

## Prerequisites
- Server running: `node server/index.js`
- App running: Visit http://localhost:5173
- At least one promo code created in admin panel

---

## 📝 How to Create Test Promo Codes

### In Admin Panel:
1. Go to: http://localhost:5173 (with admin access)
2. Navigate to "Promos" tab
3. Fill in the form:

#### Example 1: 20% Discount
```
Code: SAVE20
Description: 20% off your entire order
Discount Type: Percent
Value: 20
Apply to Delivery: NO
Active: YES
```

#### Example 2: Fixed ₦500 Off
```
Code: FLAT500
Description: ₦500 off when you spend ₦5000+
Discount Type: Fixed
Value: 500
Min Subtotal: 5000
Apply to Delivery: NO
Active: YES
```

#### Example 3: Free Delivery
```
Code: FREEDELIV
Description: Free delivery on all orders
Discount Type: Fixed  
Value: 1500
Apply to Delivery: YES
Min Subtotal: 0
Active: YES
```

#### Example 4: Maximum Discount
```
Code: MAXSAVE
Description: 50% off (testing max = subtotal)
Discount Type: Percent
Value: 50
Active: YES
```

---

## 🛒 Test Checkout Flow

### Test 1: Percent Discount
1. **Add items**: 
   - Product A: ₦5,000 x 1
   - Product B: ₦3,000 x 1
   - Subtotal: ₦8,000

2. **Go to Payment** → Check order summary
   - Subtotal: ₦8,000
   - (No discount yet)

3. **Apply Promo**: Enter "SAVE20"
   - Click "Apply"
   - 🎉 Confetti should animate!
   - Promo card should show:
     - Code: SAVE20
     - Discount Type: 📊 Percentage
     - Discount Value: 20%
     - Your Savings: ₦1,600 (20% of 8000)

4. **Check Order Summary**:
   - Subtotal: ₦8,000
   - **Promo Discount (SAVE20): -₦1,600** (in green)
   - Delivery Fee: ₦500
   - **Total: ₦6,900**

5. **Checkout**: Process payment
   - Order should be created with:
     - total: 6900
     - promo_code: "SAVE20"
     - discount_amount: 1600

---

### Test 2: Fixed Amount Discount
1. **Add items**: 
   - Product: ₦6,000
   - Subtotal: ₦6,000

2. **Go to Payment**

3. **Apply Promo**: Enter "FLAT500"
   - Should show:
     - Discount Type: 💵 Fixed Amount
     - Discount Value: ₦500
     - Your Savings: ₦500

4. **Order Summary**:
   - Subtotal: ₦6,000
   - **Promo Discount (FLAT500): -₦500**
   - Delivery: ₦500
   - **Total: ₦6,000**

---

### Test 3: Delivery Discount
1. **Add items**: ₦5,000
2. **Go to Payment** → Delivery fee shows ₦1,500
3. **Apply Promo**: Enter "FREEDELIV"
   - Should show:
     - **🚚 Applied to delivery fee** (note at bottom)
     - Your Savings: ₦1,500

4. **Order Summary**:
   - Subtotal: ₦5,000
   - Delivery Fee (before): ₦1,500
   - **Delivery Discount (FREEDELIV): -₦1,500** (in green)
   - **Total: ₦5,000**

---

### Test 4: Invalid Promo
1. **Apply Promo**: Enter "INVALID123"
2. **Should see error**:
   - ⚠️ "Promo not found"
   - No confetti
   - Promo section remains empty

---

### Test 5: Expired Promo
1. **Create promo with past expiry date**
   - Code: EXPIRED
   - Expires At: [Any past date]
   
2. **Try to apply**: Enter "EXPIRED"
3. **Should see error**: "Promo expired"

---

### Test 6: Min Subtotal Not Met
1. **Create promo**:
   - Code: MINBUY
   - Min Subtotal: ₦10,000

2. **Add items**: ₦5,000 (below minimum)

3. **Try to apply**: Enter "MINBUY"

4. **Should see error**: "Requires minimum subtotal ₦10,000"

---

### Test 7: Usage Limit Reached
1. **Create promo**:
   - Code: LIMITED
   - Max Uses: 1
   - Current Uses: 1

2. **Try to apply**: Enter "LIMITED"

3. **Should see error**: "Promo usage limit reached"

---

### Test 8: Remove Applied Promo
1. **Apply valid promo**: SAVE20
2. **Click "Remove Promo" button** (inside promo card)
3. **Expected**:
   - Promo card disappears
   - Input field clears
   - Total reverts to original (no discount)

---

## 🎯 What to Verify

### Visual/UX
- ✅ Confetti animates when promo applied (80 particles, gravity, fade)
- ✅ Promo card has gold gradient border
- ✅ Discount value shows correct math
- ✅ Error messages are red and clear
- ✅ Input field auto-capitalizes code
- ✅ "Apply" button is disabled when field empty
- ✅ "Apply" button shows loading state

### Calculations
- ✅ Percent discount: `Math.round((value / 100) * subtotal * 100) / 100`
- ✅ Fixed discount: exact value or capped at subtotal
- ✅ Delivery discount subtracts from delivery fee
- ✅ Grand total never negative
- ✅ Discount never exceeds subtotal

### Database
- ✅ Promo record shows increased `uses` count (if RPC working)
- ✅ Order created with `promo_code` and `discount_amount` fields
- ✅ Order shows correct `total` (with discount applied)

### Error Handling
- ✅ Invalid code → friendly error message
- ✅ Expired code → specific message
- ✅ Min subtotal not met → shows required amount
- ✅ Usage limit reached → clear message
- ✅ Inactive promo → error message

---

## 🐛 Debugging Tips

### If NaN appears:
```typescript
// Check browser console for:
[CheckoutPayment] promo.value is NaN: undefined
```
→ Means promo object missing `value` field
→ Check `/api/promos/validate` returns full object

### If confetti doesn't show:
```javascript
// Check browser console
// Should see: canvas created, particles generated
// If error: check if document.createElement works
```

### If discount calculates wrong:
1. Check `promo.discount_type` is "percent" or "fixed"
2. Check `promo.value` is correct number
3. Check subtotal calculation in `const total = ...`

### If order not created:
1. Check server logs: `[orders#create]` messages
2. If you see "Promo redemption failed", check RPC error message
3. If ambiguous column error, migration needs applying

---

## 📊 Expected Outputs

### Successful Promo Apply
```json
// POST /api/promos/validate?code=SAVE20&subtotal=8000
{
  "ok": true,
  "promo": {
    "code": "SAVE20",
    "description": "20% off your order",
    "discount_type": "percent",
    "value": 20,
    "apply_to_delivery": false
  },
  "discount": 1600
}
```

### Successful Order Creation
```json
// POST /api/orders/create
{
  "orderId": "12345...",
  "paystack": { /* payment data */ }
}

// Order in DB will have:
{
  "promo_code": "SAVE20",
  "discount_amount": 1600,
  "promo_applied_at": "2025-11-30T10:30:00Z",
  "total": 6900
}
```

---

## ✅ Passing Criteria

Test is successful when:
- ✅ Can apply valid promo codes
- ✅ Confetti animates on apply
- ✅ Discount displays correctly (not NaN)
- ✅ Order totals match (discount applied)
- ✅ Invalid codes show errors
- ✅ Delivery discounts work
- ✅ Can remove applied promo
- ✅ Checkout completes with promo applied

---

*Happy Testing! 🚀*
