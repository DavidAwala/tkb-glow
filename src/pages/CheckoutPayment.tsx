import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Confetti animation utility
const createConfetti = () => {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const particles: any[] = [];
  const colors = ['#D4AF37', '#556B2F', '#FFD700', '#90EE90', '#FF6B9D'];

  // Create confetti particles
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 4 + 3,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      angularVel: (Math.random() - 0.5) * 0.1,
      opacity: 1,
    });
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let hasParticles = false;

    particles.forEach((p) => {
      p.y += p.vy;
      p.x += p.vx;
      p.vy += 0.1; // gravity
      p.opacity -= 0.015;
      p.rotation += p.angularVel;

      if (p.opacity > 0) {
        hasParticles = true;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (hasParticles) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  };

  animate();
};

export default function CheckoutPayment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const confettiRef = useRef(false);

  const [cart, setCart] = useState([]);
  const [delivery, setDelivery] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState<number | null>(null);
  const [deliveryChargeInfo, setDeliveryChargeInfo] = useState<any>(null);
  const [loadingCharge, setLoadingCharge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("paystack");
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<any | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(c);

    const d = JSON.parse(localStorage.getItem("delivery_info") || "null");
    if (!d) {
      toast.error("Delivery info missing");
      navigate("/delivery");
      return;
    }
    setDelivery(d);

    // Use delivery_charge from localStorage if available, otherwise fetch
    if (d.delivery_charge && typeof d.delivery_charge === 'number') {
      setDeliveryCharge(d.delivery_charge);
      setDeliveryChargeInfo({ charge: d.delivery_charge, source: 'stored' });
    }

    if (!user) {
      navigate(`/auth?next=/delivery`);
      return;
    }
  }, [user, navigate]);

  // Strict numeric coercion to prevent NaN
  const total = Math.max(0, cart.reduce((s, it) => {
    const price = Number(it.price) || 0;
    const qty = Number(it.quantity) || 0;
    return s + (price * qty);
  }, 0));

  const baseDelivery = Math.max(0, deliveryChargeInfo 
    ? Number(deliveryChargeInfo.charge) || 0 
    : (Number(deliveryCharge) || 0));

  // Compute discount - strict numeric handling
  const discountAmount = (() => {
    if (!promo) return 0;

    const value = Number(promo.value);
    if (isNaN(value)) {
      console.warn('[CheckoutPayment] promo.value is NaN:', promo.value);
      return 0;
    }

    // If promo applies to delivery, compute discount relative to the delivery fee
    if (promo.apply_to_delivery) {
      if (promo.discount_type === 'percent') {
        const amt = (value / 100) * baseDelivery;
        const rounded = Math.round(amt * 100) / 100;
        return Math.max(0, Math.min(rounded, baseDelivery));
      } else {
        // fixed amount applied to delivery only
        return Math.max(0, Math.min(value, baseDelivery));
      }
    }

    // Otherwise compute discount relative to the product subtotal (total)
    if (promo.discount_type === 'percent') {
      const percentDiscount = (value / 100) * total;
      const rounded = Math.round(percentDiscount * 100) / 100;
      return Math.max(0, Math.min(rounded, total));
    } else if (promo.discount_type === 'fixed') {
      return Math.max(0, Math.min(value, total));
    }
    return 0;
  })();

  // Apply promo logic based on apply_to_delivery flag
  // If apply_to_delivery=true: discount reduces delivery fee
  // If apply_to_delivery=false: discount reduces product subtotal
  
  const displayedDelivery = (() => {
    if (!promo || !promo.apply_to_delivery) return baseDelivery;
    // Discount applies to delivery: reduce delivery fee
    const discountForDelivery = Number(discountAmount) || 0;
    return Math.max(0, baseDelivery - discountForDelivery);
  })();

  const subtotalAfterDiscount = (() => {
    if (!promo || promo.apply_to_delivery) return total;
    // Discount applies to subtotal: reduce product prices
    const discountForSubtotal = Number(discountAmount) || 0;
    return Math.max(0, total - discountForSubtotal);
  })();

  // Grand total: subtotal (after product discount) + delivery (after delivery discount)
  const grandTotal = Math.max(0, subtotalAfterDiscount + displayedDelivery);

  // fetch delivery charge only if not already stored
  useEffect(() => {
    const fetchCharge = async () => {
      if (!delivery || deliveryCharge !== null) return; // Skip if already have charge
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
        if (!resp.ok) {
          console.warn('delivery charge fetch failed', resp.status);
          setDeliveryCharge(0);
          return;
        }
        const data = await resp.json();
        // store full delivery charge info (includes row.notes if present)
        setDeliveryChargeInfo(data);
        setDeliveryCharge(Number(data.charge || 0));
      } catch (e) {
        console.warn('delivery charge error', e);
        setDeliveryCharge(0);
      } finally {
        setLoadingCharge(false);
      }
    };

    fetchCharge();
  }, [delivery]);

  const applyPromo = async () => {
    if (!promoCode.trim() || promoLoading) return;
    try {
      setPromoLoading(true);
      setPromoError(null);
      
      const resp = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/promos/validate?code=${encodeURIComponent(promoCode.toUpperCase())}&subtotal=${Math.round(total * 100) / 100}`
      );
      
      if (!resp.ok) {
        const txt = await resp.text();
        let msg = 'Invalid promo';
        try {
          const j = JSON.parse(txt);
          msg = j.error || msg;
        } catch {}
        setPromoError(msg);
        setPromo(null);
        return;
      }
      
      const data = await resp.json();
      if (data.promo) {
        setPromo(data.promo);
        setPromoApplied(true);
        // Trigger confetti animation
        if (!confettiRef.current) {
          confettiRef.current = true;
          createConfetti();
        }
        // Auto-hide after 2 seconds
        setTimeout(() => setPromoApplied(false), 2000);
      }
    } catch (e: any) {
      setPromoError(e?.message || 'Promo validation failed');
      setPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  // Load the Paystack inline popup script
  const loadPaystackScript = () =>
    new Promise<void>((res, rej) => {
      if (document.getElementById("paystack-script")) return res();
      const s = document.createElement("script");
      s.src = "https://js.paystack.co/v1/inline.js";
      s.id = "paystack-script";
      s.onload = () => res();
      s.onerror = rej;
      document.body.appendChild(s);
    });

  // Load the Flutterwave script
  const loadFlutterwaveScript = () =>
    new Promise<void>((res, rej) => {
      if (document.getElementById("flutterwave-script")) return res();
      const s = document.createElement("script");
      s.src = "https://checkout.flutterwave.com/v3.js";
      s.id = "flutterwave-script";
      s.onload = () => res();
      s.onerror = rej;
      document.body.appendChild(s);
    });

  const handlePaystack = async () => {
    try {
      setLoading(true);

      // Create the order draft on server (include delivery charge and promo if applied)
      const resp = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          delivery,
          delivery_charge: displayedDelivery || 0,
          client_total: grandTotal,
          payment_provider: 'paystack',
          userId: user?.id,
          email: user?.email,
          promo_code: promo?.code || null,
          discount_amount: discountAmount || 0,
        }),
      });

      // Handle HTTP error status first
      if (!resp.ok) {
        const errorText = await resp.text();
        let errorMessage = "Failed to create order";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${resp.status} ${resp.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await resp.json();
      const paystack = data.paystack;
      if (!paystack) throw new Error('Paystack init failed');

      // Load the Paystack library
      await loadPaystackScript();

      const handler = (window as any).PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user?.email || 'guest@example.com',
        amount: Math.round(grandTotal * 100),
        ref: paystack.reference,
        callback: function (response: any) {
          navigate(
            `/checkout/success?orderId=${data.orderId}&provider=paystack&reference=${response.reference}`
          );
        },
        onClose: function () {
          toast('Payment popup closed');
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFlutterwave = async () => {
    try {
      setLoading(true);

      // Create the order draft on server (include delivery charge and promo if applied)
      const resp = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          delivery,
          delivery_charge: displayedDelivery || 0,
          client_total: grandTotal,
          payment_provider: 'flutterwave',
          userId: user?.id,
          email: user?.email,
          promo_code: promo?.code || null,
          discount_amount: discountAmount || 0,
        }),
      });

      // Handle HTTP error status first
      if (!resp.ok) {
        const errorText = await resp.text();
        let errorMessage = "Failed to create order";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${resp.status} ${resp.statusText}`;
        }
        console.error('[CheckoutPayment] Order creation failed:', errorMessage, 'Response:', errorText);
        throw new Error(errorMessage);
      }

      const data = await resp.json();
      const flutterwave = data.flutterwave;
      if (!flutterwave) {
        console.error('[CheckoutPayment] No flutterwave data in response:', data);
        throw new Error('Flutterwave init failed: server returned no payment data');
      }

      console.log('[CheckoutPayment] Flutterwave data received:', flutterwave);

      // Load the Flutterwave library
      await loadFlutterwaveScript();

      // Try inline Flutterwave modal first (requires public key)
      const FwAPI = (window as any).FlutterwaveCheckout;
      const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '';
      const txRef = `FLW-${data.orderId}`;
      try {
        if (FwAPI && publicKey) {
          console.log('[CheckoutPayment] Opening inline Flutterwave modal');
          (window as any).FlutterwaveCheckout({
            public_key: publicKey,
            tx_ref: txRef,
            amount: Math.round(grandTotal * 100) / 100,
            currency: 'NGN',
            payment_options: 'card,ussd,banktransfer',
            customer: {
              email: user?.email || 'guest@example.com',
              phone_number: (delivery?.address?.phone || delivery?.phone || '') as any,
              name: user?.email ? user.email.split('@')[0] : 'Guest'
            },
            customizations: {
              title: 'TKB Glow Order',
              description: `Payment for order ${data.orderId?.slice(0,8)}`
            },
            callback: function (resp: any) {
              try {
                // Flutterwave returns different props depending on integration; pick a sensible id
                const txId = resp.transaction_id || resp.tx_id || resp.id || resp.data?.id || '';
                navigate(`/checkout/success?orderId=${data.orderId}&provider=flutterwave&transaction_id=${txId}`);
              } catch (e) {
                console.warn('Flutterwave callback navigation failed', e);
              }
            },
            onclose: function () {
              toast('Payment popup closed');
            }
          });
          return;
        }
      } catch (e) {
        console.warn('Flutterwave inline failed, falling back to redirect', e);
      }

      // Fallback: if server returned hosted link, redirect
      if (flutterwave.link) {
        window.location.href = flutterwave.link;
      } else if (flutterwave.checkout_url) {
        window.location.href = flutterwave.checkout_url;
      } else {
        throw new Error('No Flutterwave payment link received');
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4 pb-24">
      <h1 className="text-lg font-bold text-[#556B2F] mb-4">Payment</h1>

      {/* ORDER SUMMARY */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <h2 className="text-sm font-semibold mb-3">Order Summary</h2>

        {cart.map((it) => (
          <div key={it.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <img
                src={it.image}
                className="h-10 w-10 object-cover rounded"
              />
              <div>
                <div className="text-sm font-medium">{it.name}</div>
                <div className="text-xs text-muted-foreground">
                  Qty: {it.quantity}
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold">
              ₦{(it.price * it.quantity).toLocaleString()}
            </div>
          </div>
        ))}

        <div className="mt-4 space-y-2 border-t pt-4">
          <div className="flex items-center justify-between text-sm text-gray-700">
            <div>Subtotal</div>
            <div className="font-semibold">₦{Math.round(total * 100) / 100}</div>
          </div>
          
          {promo && !promo.apply_to_delivery && (
            <div className="flex items-center justify-between text-sm text-green-600 font-semibold">
              <div>Promo Discount ({promo.code})</div>
              <div>-₦{Math.round(discountAmount * 100) / 100}</div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-700">
            <div>Delivery Fee{deliveryChargeInfo?.row?.notes ? ` — ${deliveryChargeInfo.row.notes}` : ''}</div>
            <div className="font-semibold">₦{Math.round(displayedDelivery * 100) / 100}</div>
          </div>

          {promo && promo.apply_to_delivery && (
            <div className="flex items-center justify-between text-sm text-green-600 font-semibold">
              <div>Delivery Discount ({promo.code})</div>
              <div>-₦{Math.round(discountAmount * 100) / 100}</div>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between text-base font-bold border-t pt-3">
            <div>Total</div>
            <div className="text-xl font-black text-[#D4AF37]">₦{Math.round(grandTotal * 100) / 100}</div>
          </div>
        </div>
      </div>

      {/* PAYMENT METHOD */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2">Payment Method</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedProvider("paystack")}
            className={`flex-1 p-3 rounded border ${
              selectedProvider === "paystack"
                ? "border-[#D4AF37]"
                : "border-border"
            }`}
          >
            Paystack
          </button>

          <button
            onClick={() => setSelectedProvider("flutterwave")}
            className={`flex-1 p-3 rounded border ${
              selectedProvider === "flutterwave"
                ? "border-[#D4AF37]"
                : "border-border"
            }`}
          >
            Flutterwave
          </button>
        </div>
      </div>

      {/* PROMO CODE SECTION - MODERN DESIGN */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl mb-4 border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🎁</span>
            <h3 className="text-sm font-bold text-slate-800">Have a Promo Code?</h3>
          </div>
          <p className="text-xs text-slate-600">Get instant discounts on your order</p>
        </div>

        {/* Input Section */}
        <div className="flex gap-2 mb-4">
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter code (e.g., SAVE20)"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition text-sm font-medium"
          />
          <button
            onClick={applyPromo}
            disabled={promoLoading || !promoCode.trim()}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              promoLoading || !promoCode.trim()
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-[#556B2F] text-white hover:bg-[#45571f] shadow-md active:shadow-sm'
            }`}
          >
            {promoLoading ? (
              <>
                <span className="animate-spin">⏳</span> Checking...
              </>
            ) : (
              <>
                <span>✓</span> Apply
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {promoError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <span className="text-red-600 font-bold text-lg">⚠</span>
            <div>
              <p className="text-xs font-semibold text-red-700">Invalid Promo</p>
              <p className="text-xs text-red-600">{promoError}</p>
            </div>
          </div>
        )}

        {/* Success Message - Confetti will play on apply */}
        {promoApplied && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 animate-pulse">
            <p className="text-sm font-bold text-green-700">✨ Promo Applied Successfully!</p>
          </div>
        )}

        {/* Applied Promo Card */}
        {promo && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-[#D4AF37]/10 via-[#556B2F]/10 to-[#D4AF37]/10 border-2 border-[#D4AF37] shadow-lg transform transition hover:scale-[1.02]">
            {/* Promo Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Promo Applied</p>
                <p className="text-lg font-black text-[#D4AF37]">{promo.code}</p>
              </div>
              <span className="text-3xl">💰</span>
            </div>

            {/* Description */}
            {promo.description && (
              <p className="text-xs text-slate-700 mb-3 italic">{promo.description}</p>
            )}

            {/* Discount Details */}
            <div className="bg-white rounded-lg p-3 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Discount Type:</span>
                <span className="text-xs font-bold text-[#556B2F] bg-[#556B2F]/10 px-3 py-1 rounded-full">
                  {promo.discount_type === 'percent' ? '📊 Percentage' : '💵 Fixed Amount'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Discount Value:</span>
                <span className="text-sm font-black text-[#D4AF37]">
                  {promo.discount_type === 'percent' ? `${promo.value}%` : `₦${Number(promo.value).toLocaleString()}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Your Savings:</span>
                <span className="text-sm font-black text-green-600">₦{Math.round(discountAmount * 100) / 100}</span>
              </div>
              {promo.apply_to_delivery && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <span>🚚</span> Applied to delivery fee
                  </p>
                </div>
              )}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => {
                setPromo(null);
                setPromoCode('');
                setPromoError(null);
              }}
              className="w-full text-xs font-semibold text-slate-600 hover:text-red-600 transition py-2 border-t border-[#D4AF37]/30"
            >
              Remove Promo
            </button>
          </div>
        )}
      </div>

      {/* FOOTER BUTTONS */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-3">
        <Button variant="ghost" onClick={() => navigate("/")}>
          Edit Cart
        </Button>

        <Button
          className="flex-1 bg-[#D4AF37]"
          onClick={() => {
            if (selectedProvider === "paystack") handlePaystack();
            else if (selectedProvider === "flutterwave") handleFlutterwave();
          }}
          disabled={loading}
        >
          {loading ? "Preparing..." : "Purchase"}
        </Button>
      </div>
    </div>
  );
}
