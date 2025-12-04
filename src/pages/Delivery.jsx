import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Home, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";

import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "260px", borderRadius: "14px" };
const defaultCenter = { lat: 6.5244, lng: 3.3792 }; // Lagos

// -----------------------------
// Nigeria states and major cities (representative list)
// -----------------------------
// If you want more cities added for any state, tell me the state name.
const NIGERIA_REGION_DATA = [
  { state: "Abia", cities: ["Aba", "Umuahia", "Ohafia", "Arochukwu"] },
  { state: "Adamawa", cities: ["Yola", "Mubi", "Ganye", "Numan"] },
  { state: "Akwa Ibom", cities: ["Uyo", "Ikot Ekpene", "Eket", "Oron"] },
  { state: "Anambra", cities: ["Awka", "Onitsha", "Nnewi", "Aguata"] },
  { state: "Bauchi", cities: ["Bauchi", "Azare", "Misau", "Toro"] },
  { state: "Bayelsa", cities: ["Yenagoa", "Brass", "Odi", "Nembe"] },
  { state: "Benue", cities: ["Makurdi", "Gboko", "Otukpo", "Tarka"] },
  { state: "Borno", cities: ["Maiduguri", "Bama", "Dikwa", "Gwoza"] },
  { state: "Cross River", cities: ["Calabar", "Ikom", "Ogoja", "Boki"] },
  { state: "Delta", cities: ["Warri", "Asaba", "Sapele", "Effurun"] },
  { state: "Ebonyi", cities: ["Abakaliki", "Ikwo", "Ezza", "Ohaozara"] },
  { state: "Edo", cities: ["Benin City", "Auchi", "Uromi", "Ehor"] },
  { state: "Ekiti", cities: ["Ado Ekiti", "Ikere", "Emure", "Ise/Orun"] },
  { state: "Enugu", cities: ["Enugu", "Nsukka", "Awgu", "Udi"] },
  { state: "Gombe", cities: ["Gombe", "Kumo", "Billiri", "Kaltungo"] },
  { state: "Imo", cities: ["Owerri", "Orlu", "Okigwe", "Mbaise"] },
  { state: "Jigawa", cities: ["Dutse", "Hadejia", "Gumel", "Kiyawa"] },
  { state: "Kaduna", cities: ["Kaduna", "Zaria", "Kafanchan", "Kagoro"] },
  { state: "Kano", cities: ["Kano", "Wudil", "Gaya", "Kumbotso"] },
  { state: "Katsina", cities: ["Katsina", "Funtua", "Kankara", "Dutsin-Ma"] },
  { state: "Kebbi", cities: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru"] },
  { state: "Kogi", cities: ["Lokoja", "Anyigba", "Okene", "Idah"] },
  { state: "Kwara", cities: ["Ilorin", "Offa", "Jebba", "Lafiagi"] },
  { state: "Lagos", cities: ["Lagos", "Ikeja", "Lekki", "Ikorodu", "Yaba", "Surulere"] },
  { state: "Nasarawa", cities: ["Lafia", "Akwanga", "Keffi", "Kokona"] },
  { state: "Niger", cities: ["Minna", "Bida", "Kontagora", "Suleja"] },
  { state: "Ogun", cities: ["Abeokuta", "Ifo", "Sagamu", "Ijebu Ode"] },
  { state: "Ondo", cities: ["Akure", "Ondo", "Owo", "Ikare"] },
  { state: "Osun", cities: ["Osogbo", "Ile-Ife", "Ilesha", "Ede"] },
  { state: "Oyo", cities: ["Ibadan", "Ogbomosho", "Oyo", "Iseyin"] },
  { state: "Plateau", cities: ["Jos", "Barkin Ladi", "Pankshin", "Mangu"] },
  { state: "Rivers", cities: ["Port Harcourt", "Obio-Akpor", "Ahoada", "Bonny"] },
  { state: "Sokoto", cities: ["Sokoto", "Gwadabawa", "Tambuwal", "Wurno"] },
  { state: "Taraba", cities: ["Jalingo", "Wukari", "Takum", "Sardauna"] },
  { state: "Yobe", cities: ["Damaturu", "Gashua", "Gujba", "Potiskum"] },
  { state: "Zamfara", cities: ["Gusau", "Talata Mafara", "Anka", "Kaura Namoda"] },
  { state: "FCT", cities: ["Abuja"] },
];

// Helper: find state record by name (case-insensitive)
function findStateRecord(name) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return NIGERIA_REGION_DATA.find((r) => r.state.toLowerCase() === n) || null;
}

// Helper: attempt to match a city to a state's city list (loose)
function matchCityInState(stateRecord, cityName) {
  if (!stateRecord || !cityName) return null;
  const city = cityName.trim().toLowerCase();
  const found = stateRecord.cities.find((c) => c.toLowerCase() === city);
  if (found) return found;
  // try partial matching
  return stateRecord.cities.find((c) => c.toLowerCase().includes(city)) || null;
}

export default function DeliveryPage() {
  const navigate = useNavigate();

  const [coords, setCoords] = useState(defaultCenter);

  const [formData, setFormData] = useState({
    address: "",
    phone: "",
    city: "",
    state: "",
    notes: "",
  });

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [chargeLoading, setChargeLoading] = useState(false);
  const [chargeSource, setChargeSource] = useState(""); // "city", "state", or "default"

  // Load saved delivery_info on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("delivery_info");
      if (saved) {
        const parsed = JSON.parse(saved);
        const addr = parsed.address || {};
        setFormData((s) => ({
          ...s,
          address: addr.raw_address || addr.confirmed_address || "",
          phone: addr.phone || "",
          city: addr.city || s.city,
          state: addr.state || s.state,
          notes: addr.notes || "",
        }));
        if (parsed.lat && parsed.lng) {
          setCoords({ lat: parsed.lat, lng: parsed.lng });
        }
        if (parsed.delivery_charge) setDeliveryCharge(parsed.delivery_charge);
      }
    } catch (err) {
      // ignore parse errors
      console.warn("Could not read delivery_info from localStorage");
    }
  }, []);

  // Fetch delivery charge whenever city or state changes
  useEffect(() => {
    if (!formData.city || !formData.state) {
      setDeliveryCharge(0);
      setChargeSource("");
      return;
    }

    const fetchCharge = async () => {
      setChargeLoading(true);
      try {
        const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const subtotal = cart.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);

        const res = await fetch(
          `${serverUrl}/api/delivery/charge?city=${encodeURIComponent(formData.city)}&state=${encodeURIComponent(formData.state)}&subtotal=${encodeURIComponent(subtotal)}`
        );

        if (!res.ok) throw new Error("Failed to fetch charge");

        const data = await res.json();
        setDeliveryCharge(data.charge || 0);
        setChargeSource(data.source || "default");
      } catch (err) {
        console.error("Charge fetch error:", err);
        setDeliveryCharge(0);
        setChargeSource("");
      } finally {
        setChargeLoading(false);
      }
    };

    fetchCharge();
  }, [formData.city, formData.state]);

  // --------------------
  // Google Maps: when user clicks map we reverse-geocode and fill address/state/city
  // --------------------
  const handleMapClick = async (e) => {
    try {
      // e from GoogleMap onClick -> has latLng
      const lat = typeof e.latLng.lat === "function" ? e.latLng.lat() : e.lat;
      const lng = typeof e.latLng.lng === "function" ? e.latLng.lng() : e.lng;

      setCoords({ lat, lng });

      // Call Google Geocode API (reverse)
      const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!key) {
        toast.error("Google Maps API key not configured (VITE_GOOGLE_MAPS_API_KEY)");
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}&result_type=street_address|premise|subpremise|route|locality|administrative_area_level_1`;
      const res = await fetch(url);
      const json = await res.json();

      if (!json || json.status !== "OK" || !json.results || json.results.length === 0) {
        setIsWarningOpen(true);
        return;
      }

      const best = json.results[0];
      const formatted = best.formatted_address || "";
      setValidatedAddress(formatted);

      // parse address components
      const comps = best.address_components || [];
      let city = "";
      let state = "";

      for (const c of comps) {
        if (c.types.includes("locality") || c.types.includes("sublocality") || c.types.includes("postal_town")) {
          city = city || c.long_name;
        }
        if (c.types.includes("administrative_area_level_1")) {
          state = state || c.long_name;
        }
        // fallback for some OSM-backed vs Google differences
        if (!city && c.types.includes("administrative_area_level_2")) {
          city = city || c.long_name;
        }
      }

      // Try to match state exactly to our state list (case-insensitive)
      const stateRecord = findStateRecord(state);
      if (stateRecord) {
        // If we have a matching state, try to match the city into that state's city list
        const matchedCity = matchCityInState(stateRecord, city) || city;
        setFormData((s) => ({
          ...s,
          address: formatted,
          city: matchedCity || s.city,
          state: stateRecord.state,
        }));
      } else {
        // If state not matched (naming mismatch), attempt fuzzy match across all states
        const lowerState = (state || "").toLowerCase();
        const fuzzy = NIGERIA_REGION_DATA.find((r) => r.state.toLowerCase().includes(lowerState));
        if (fuzzy) {
          const matchedCity = matchCityInState(fuzzy, city) || city;
          setFormData((s) => ({
            ...s,
            address: formatted,
            city: matchedCity || s.city,
            state: fuzzy.state,
          }));
        } else {
          // fallback: fill what we have but leave dropdown untouched
          setFormData((s) => ({
            ...s,
            address: formatted,
            city: city || s.city,
            // keep state as is if no match
            state: s.state,
          }));
        }
      }
    } catch (err) {
      console.error("Reverse geocode error", err);
      toast.error("Couldn't identify that location automatically. Please fill fields manually.");
      setIsWarningOpen(true);
    }
  };

  // Standard geocode from text (used on submit)
  const validateAddress = async () => {
    const fullAddress = `${formData.address}, ${formData.city}, ${formData.state}`;
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) {
      toast.error("Google Maps API key missing");
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${key}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.results && data.results.length) {
        const best = data.results[0];
        setValidatedAddress(best.formatted_address);
        setCoords({
          lat: best.geometry.location.lat,
          lng: best.geometry.location.lng,
        });
        saveAndContinue(best.formatted_address);
      } else {
        setIsWarningOpen(true);
      }
    } catch (err) {
      console.error(err);
      setIsWarningOpen(true);
    }
  };

  // Save to localStorage and go to checkout/payment
  const saveAndContinue = (confirmedAddress) => {
    localStorage.setItem(
      "delivery_info",
      JSON.stringify({
        address: {
          raw_address: formData.address,
          confirmed_address: confirmedAddress || formData.address,
          phone: formData.phone,
          city: formData.city,
          state: formData.state,
          notes: formData.notes,
        },
        lat: coords.lat,
        lng: coords.lng,
        delivery_charge: deliveryCharge,
      })
    );
    navigate("/checkout/payment");
  };

  // Form submit
  const handleNext = () => {
    if (!formData.address || !formData.phone || !formData.city || !formData.state) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    validateAddress();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4 pb-32">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#556B2F] mb-2">Delivery Details</h1>
          <p className="text-sm text-gray-600">Provide your delivery address and we'll calculate the delivery charge</p>
        </div>

        {/* Delivery Charge Alert */}
        {deliveryCharge > 0 && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Zap className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              Delivery Charge: <span className="font-semibold">₦{deliveryCharge.toLocaleString()}</span>
              {chargeSource && <span className="text-xs ml-2">(Based on {chargeSource})</span>}
            </AlertDescription>
          </Alert>
        )}

        {/* MAP */}
        <Card className="mb-6 overflow-hidden">
          <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={coords}
              zoom={14}
              onClick={handleMapClick}
            >
              <Marker position={coords} />
            </GoogleMap>
          </LoadScript>

          <p className="text-[11px] text-center p-2 text-gray-500 bg-white">
            Tap the map to pin your exact delivery location.
          </p>
        </Card>

        {/* FORM */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            {/* Address */}
            <div>
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <Home className="w-4 h-4" />
                Street Address <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. 12 Adeola Odeku Street"
                className="mt-1 border-gray-300 focus-visible:ring-0 focus:border-[#D4AF37]"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" />
                Contact Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                placeholder="e.g. 08012345678"
                className="mt-1 border-gray-300 focus-visible:ring-0 focus:border-[#D4AF37]"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Country/State/City */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">Country</label>
                <select disabled className="w-full p-2 rounded border bg-gray-100 text-gray-500">
                  <option>Nigeria</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">State <span className="text-red-500">*</span></label>
                <select
                  value={formData.state}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setFormData((s) => ({ ...s, state: selected, city: "" }));
                  }}
                  className="w-full p-2 rounded border focus:border-[#D4AF37] outline-none"
                >
                  <option value="">Select State</option>
                  {NIGERIA_REGION_DATA.map((s) => (
                    <option key={s.state} value={s.state}>
                      {s.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">City <span className="text-red-500">*</span></label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData((s) => ({ ...s, city: e.target.value }))}
                  className="w-full p-2 rounded border focus:border-[#D4AF37] outline-none"
                >
                  <option value="">Select City</option>
                  {(findStateRecord(formData.state)?.cities || []).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Delivery Notes */}
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Delivery Notes <span className="text-gray-400">(Optional)</span>
              </label>
              <Textarea
                placeholder="Any special instructions for delivery? e.g. Beware of dog, use back gate"
                className="border-gray-300 focus-visible:ring-0 focus:border-[#D4AF37] resize-none"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Charge Loading Indicator */}
        {chargeLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            Calculating delivery charge...
          </div>
        )}
      </div>

      {/* CTA BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto">
          {deliveryCharge > 0 && (
            <div className="mb-3 p-3 bg-gray-50 rounded text-sm font-medium text-gray-900">
              Estimated Delivery: <span className="text-[#D4AF37]">₦{deliveryCharge.toLocaleString()}</span>
            </div>
          )}
          <Button
            className="w-full bg-[#D4AF37] text-white font-semibold py-3 h-12 text-sm rounded-lg hover:bg-[#c99a2e]"
            onClick={handleNext}
            disabled={loading || chargeLoading || !formData.address || !formData.phone || !formData.city || !formData.state}
          >
            {loading ? "Validating..." : "Proceed to Payment"}
          </Button>
        </div>
      </div>

      {/* WARNING MODAL (ADDRESS NOT RECOGNIZED) */}
      <Dialog open={isWarningOpen} onOpenChange={setIsWarningOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-[#556B2F] text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Address Not Recognized
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-gray-600 leading-relaxed">
            We couldn't find an exact match for the address you entered. You can fix it or continue with the address as provided. Our delivery team will contact you if there are any issues.
          </p>

          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              className="text-xs border-gray-300"
              onClick={() => setIsWarningOpen(false)}
            >
              Edit Address
            </Button>

            <Button
              className="bg-[#D4AF37] text-white text-xs"
              onClick={() => saveAndContinue(null)}
            >
              Continue Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}