# Code Changes Reference — Line-by-Line

## File 1: `server/routes/orders.js`

### Change 1: Fix Paystack Payment Amount (Line ~120)
**Before:**
```javascript
amount: Math.round(total * 100),  // ERROR: total is undefined
```

**After:**
```javascript
amount: Math.round(totalToUse * 100),  // FIXED: use totalToUse variable
```

**Why:** The variable `total` doesn't exist in this scope. The correct computed total is `totalToUse` which includes promo discounts.

---

### Change 2: Fix Flutterwave Payment Amount (Line ~138)
**Before:**
```javascript
amount: Math.round(total * 100) / 100,  // ERROR: total is undefined
```

**After:**
```javascript
amount: Math.round(totalToUse * 100) / 100,  // FIXED: use totalToUse variable
```

**Why:** Same issue as above. Flutterwave also needs the correct total.

---

### Change 3: Return wa_link from Notify Endpoint (Line ~387)
**Before:**
```javascript
return res.json({ ok: true, message: 'WhatsApp notification sent', result });
```

**After:**
```javascript
// If server returned a wa.me link (customer target), include it for admin click-to-chat
const responseData = { ok: true, message: 'WhatsApp notification sent', result };
if (result.wa_link) {
  responseData.wa_link = result.wa_link;
  responseData.message = 'WhatsApp click-to-chat link ready for admin';
}
return res.json(responseData);
```

**Why:** When `sendWhatsAppNotification()` detects a customer target, it returns `{ wa_link: "...", success: true }` instead of sending programmatically. We need to pass this link back to the frontend so admin can open it.

---

## File 2: `src/pages/Admin.tsx`

### Change 1: Add x-admin-secret Header to Orders Fetch (Line ~1025)
**Before:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/orders`);
```

**After:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/orders`, { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } });
```

**Why:** Server's adminAuth middleware requires this header. Without it, request is rejected with 401.

---

### Change 2: Add x-admin-secret Header to Drivers Fetch (Line ~1037)
**Before:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/drivers`);
```

**After:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/drivers`, { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } });
```

---

### Change 3: Add x-admin-secret Header to Delivery Charges Fetch (Line ~1049)
**Before:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/delivery-charges`);
```

**After:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/delivery-charges`, { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } });
```

---

### Change 4: Add x-admin-secret Header to Driver Create/Update (Line ~828-836)
**Before:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/drivers/${driver.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(form)
});
```

**After:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/drivers/${driver.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' },
  body: JSON.stringify(form)
});
```

**And for create (POST):**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/drivers`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' },
  body: JSON.stringify(form)
});
```

---

### Change 5: Add x-admin-secret Header to Delivery Charge Create/Update (Line ~898-906)
**Before:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/delivery-charges/${charge.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(form)
});
```

**After:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/delivery-charges/${charge.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' },
  body: JSON.stringify(form)
});
```

**And for POST:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/delivery-charges`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' },
  body: JSON.stringify(form)
});
```

---

### Change 6: Add x-admin-secret to Inline Delete Buttons
**Before:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/drivers/${driver.id}`, { method: 'DELETE' });
```

**After:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/drivers/${driver.id}`, { method: 'DELETE', headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } });
```

**And for delivery charges:**
```javascript
const resp = await fetch(`${serverUrl}/api/admin/delivery-charges/${charge.id}`, { method: 'DELETE', headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } });
```

---

### Change 7: Enhance Image Upload Validation (Line ~85-110)
**Before:**
```javascript
const handleImageUpload = async (file: File) => {
  if (!file) return;
  setUploading(true);
  try {
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
    const { data, error } = await supabase.storage.from('uploads').upload(filename, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: publicData } = supabase.storage.from('uploads').getPublicUrl(data.path);
    const imageUrl = publicData?.publicUrl;
    const currentImages = Array.isArray(form.images) ? form.images : (form.images ? [form.images] : []);
    setForm({ ...form, images: [...currentImages, imageUrl] });
    toast.success('Image uploaded');
  } catch (err) {
    console.error('Image upload error:', err);
    toast.error('Failed to upload image');
  } finally {
    setUploading(false);
  }
};
```

**After:**
```javascript
const handleImageUpload = async (file: File) => {
  if (!file) return;
  setUploading(true);
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate a unique filename
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
    console.log('[Admin] Uploading image:', filename);
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filename, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('[Admin] Upload error response:', error);
      throw new Error(error.message || 'Upload failed');
    }

    console.log('[Admin] Upload successful, file path:', data?.path);

    // Get public URL (Supabase returns URL without extra transformation for public buckets)
    const { data: publicData } = supabase.storage.from('uploads').getPublicUrl(data.path);
    const imageUrl = publicData?.publicUrl;

    if (!imageUrl) {
      throw new Error('Failed to generate public URL for uploaded image');
    }

    console.log('[Admin] Public URL generated:', imageUrl);

    // Add to images array (handle both array and single URL)
    const currentImages = Array.isArray(form.images) ? form.images : (form.images ? [form.images] : []);
    setForm({ ...form, images: [...currentImages, imageUrl] });
    toast.success('Image uploaded successfully');
  } catch (err) {
    console.error('Image upload error:', err);
    toast.error(err?.message || 'Failed to upload image');
  } finally {
    setUploading(false);
  }
};
```

**Changes:**
- ✅ File type validation (images only)
- ✅ File size check (max 5MB)
- ✅ Detailed console logging at each step
- ✅ Better error messages
- ✅ Public URL validation

---

### Change 8: Handle wa_link Response from Notify Endpoint (Line ~311-324)
**Before:**
```javascript
const response = await fetch(`${serverUrl}/api/orders/${order.id}/notify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type, message, channel: 'whatsapp' })
});

if (!response.ok) throw new Error('Failed to send notification');

toast.success(`... notification sent via WhatsApp`);
setNotificationMessage('');
```

**After:**
```javascript
const response = await fetch(`${serverUrl}/api/orders/${order.id}/notify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type, message, channel: 'whatsapp' })
});

if (!response.ok) throw new Error('Failed to send notification');

const json = await response.json().catch(() => ({}));

// If server returned a wa.me link for admin click-to-chat, open it
if (json && json.wa_link) {
  try {
    window.open(json.wa_link, '_blank');
    toast.success('Opened WhatsApp link for admin');
  } catch (e) {
    toast.success('WhatsApp link ready: copy or open it');
  }
} else {
  toast.success(`... notification sent via WhatsApp`);
}

setNotificationMessage('');
```

**Why:** When server returns `wa_link` (for customer targets), admin UI opens it in new tab so admin can send via click-to-chat.

---

## File 3: `src/pages/CheckoutPayment.tsx`

### Change: Guard Delivery Charge Fetch (Line ~85-105)
**Before:**
```javascript
const fetchCharge = async () => {
  if (!delivery || deliveryCharge !== null) return;
  try {
    setLoadingCharge(true);
    const state = encodeURIComponent(delivery.state || '');
    const city = encodeURIComponent(delivery.city || '');
    const resp = await fetch(
      `${import.meta.env.VITE_SERVER_URL}/api/delivery/charge?state=${state}&city=${city}&subtotal=${total}`
    );
    // ... rest of fetch
  }
}
```

**After:**
```javascript
const fetchCharge = async () => {
  if (!delivery || deliveryCharge !== null) return;
  try {
    setLoadingCharge(true);
    // delivery saved from Delivery page has shape { address: { city, state, ... }, delivery_charge }
    const cityVal = delivery?.address?.city || delivery?.city || '';
    const stateVal = delivery?.address?.state || delivery?.state || '';

    // Only query server when we have both city and state to avoid accidental fallback
    if (!cityVal || !stateVal) {
      console.warn('Skipping delivery charge fetch: city/state missing', { city: cityVal, state: stateVal });
      setDeliveryCharge(0);
      setDeliveryChargeInfo(null);
      return;
    }

    const state = encodeURIComponent(stateVal);
    const city = encodeURIComponent(cityVal);
    const resp = await fetch(
      `${import.meta.env.VITE_SERVER_URL}/api/delivery/charge?state=${state}&city=${city}&subtotal=${total}`
    );
    // ... rest of fetch
  }
}
```

**Why:** Prevents calling delivery charge API with empty city/state, which would cause fallback to default ₦1500 fee.

---

## File 4: `src/pages/Delivery.jsx`

### Change: Fix Delivery Charge Guard Condition (Line ~33)
**Before:**
```javascript
if (!formData.city && !formData.state) {  // Only skip if BOTH empty
  setDeliveryCharge(0);
  setChargeSource("");
  return;
}
```

**After:**
```javascript
if (!formData.city || !formData.state) {  // Skip if EITHER empty
  setDeliveryCharge(0);
  setChargeSource("");
  return;
}
```

**Why:** Changed `&&` (AND) to `||` (OR). Should skip fetch if EITHER city OR state is missing, not only if both are missing. Prevents early queries with partial data.

---

## Summary of All Changes

| File | Type | Count | Impact |
|------|------|-------|--------|
| `server/routes/orders.js` | Bug Fix | 3 | Checkout no longer crashes, wa_link returned |
| `src/pages/Admin.tsx` | Auth Fix | 8 | Admin pages load, uploads enhanced, wa_link handled |
| `src/pages/CheckoutPayment.tsx` | Guard | 1 | Delivery charge always correct |
| `src/pages/Delivery.jsx` | Guard | 1 | No premature charge queries |
| **TOTAL** | | **13** | **All critical issues resolved** |

---

## Verification

To verify all changes were applied:

1. **Check** `server/routes/orders.js` for `totalToUse` (lines 120, 138)
2. **Check** `src/pages/Admin.tsx` for `x-admin-secret` headers (multiple locations)
3. **Check** `src/pages/Admin.tsx` for enhanced `handleImageUpload` function
4. **Check** `src/pages/Admin.tsx` for wa_link handler in notify section
5. **Check** `src/pages/CheckoutPayment.tsx` for delivery charge guard
6. **Check** `src/pages/Delivery.jsx` for `||` instead of `&&` on line 33

All changes are now in place. ✅
