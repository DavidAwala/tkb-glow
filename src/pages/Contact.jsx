import { useState } from "react";
import { MapPin, Phone, Mail, Send, MessageCircle, ArrowRight, Menu } from "lucide-react";
import { motion } from "framer-motion";

import { useNavigate } from "react-router-dom";
import { ShoppingCart, LogOut, Package, Instagram, Facebook,  Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
 
  // Helper to check active state for styling
  const isActive = (path) => location.pathname === path;


// --- TKB Brand Colors & Details ---
const BRAND = {
  OLIVE: '#556B2F',
  GOLD: '#D4AF37',
  SOFT_WHITE: '#FAFAF8',
  PHONE: '0813 634 5026',
  EMAIL: 'thekramiebrand@gmail.com',
  LOCATION: 'Port Harcourt, Rivers State, Nigeria',
  INSTAGRAM: 'https://www.instagram.com/thekramiebrand',
  WHATSAPP_LINK: `https://wa.me/2348136345026`,
};

// TikTok Icon Wrapper (pure JSX)
const TikTokIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export default function Contact() {

 const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Cart drawer logic
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Shop", path: "/" },
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "FAQ", path: "/faq" },
  ];




  const updateQty = (id, qty) => {
    setCartItems(items =>
      items.map(item => item.id === id ? { ...item, quantity: qty } : item)
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePurchase = () => {
    if (!user) {
      navigate("/auth?next=/delivery");
      setIsCartOpen(false);
      return;
    }
    setIsCartOpen(false);
    navigate("/delivery");
  };

  // Newsletter logic
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email) return;
    setStatus("loading");

    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({ email });

      if (error) {
        if (error.code === "23505") {
          alert("You are already subscribed!");
          setStatus("idle");
        } else {
          throw error;
        }
      } else {
        setStatus("success");
        setEmail("");
      }
    } catch (err) {
      setStatus("error");
    }
  };




  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", form);
    alert("Message sent! We'll get back to you shortly.");
    setForm({ name: "", email: "", message: "" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* 1. LEFT: LOGO */}
        <div className="flex-shrink-0">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
            <img 
              src="/logo.png" 
              alt="TKB" 
              className="h-10 w-auto object-contain hover:opacity-80 transition-opacity" 
            />
          </Link>
        </div>

        {/* 2. MIDDLE: DESKTOP NAVIGATION (Hidden on Mobile) */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#D4AF37]",
                isActive(link.path) 
                  ? "text-[#556B2F] font-semibold" 
                  : "text-gray-600"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
          <div className="flex items-center gap-2">
            {user && (
              <>
                <Button variant="ghost" size="icon" title="My orders" onClick={() => navigate('/account/orders')}>
                  <Package className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Button>

                   {/* Mobile Menu Toggle (Visible only on Mobile) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="md:hidden text-[#556B2F]"
                          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                          {isMobileMenuOpen ? (
                            <X className="h-6 w-6" />
                          ) : (
                            <Menu className="h-6 w-6" />
                          )}
                        </Button>
          </div>
        </div>

        
                  

          {/* 4. MOBILE MENU DROPDOWN */}
              {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-[#FAFAF8] border-b border-[#556B2F]/10 shadow-lg animate-in slide-in-from-top-5">
                  <nav className="flex flex-col p-4 space-y-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-[#556B2F]/5",
                          isActive(link.path)
                            ? "text-[#556B2F] bg-[#556B2F]/10 font-semibold"
                            : "text-gray-600"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                    
                  </nav>
                </div>)}
      </header>
      {/* HERO HEADER */}
      <header className="bg-[#556B2F] py-16 md:py-24 text-white text-center mt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-serif mb-3">Let's Connect.</h1>
          <p className="mt-2 text-lg md:text-xl text-gray-200">
            We're here to elevate your journey to glow and alignment.
          </p>
        </motion.div>
      </header>
    <div className="min-h-screen bg-[#FAFAF8] text-[#556B2F]">
      {/* MAIN GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-12 lg:gap-20">

        {/* CONTACT INFORMATION */}
        <div className="order-2 md:order-1">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-serif text-[#556B2F] mb-8 border-b border-[#D4AF37] pb-2"
          >
            Direct Support
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            className="space-y-8"
          >

            {/* LOCATION */}
            <motion.div variants={itemVariants} className="flex items-start gap-4">
              <MapPin className="text-[#D4AF37] h-6 w-6 mt-1" />
              <div>
                <h3 className="text-xl font-semibold">Our Location</h3>
                <p className="text-gray-600">{BRAND.LOCATION}</p>
              </div>
            </motion.div>

            {/* PHONE */}
            <motion.div variants={itemVariants} className="flex items-start gap-4">
              <Phone className="text-[#D4AF37] h-6 w-6 mt-1" />
              <div>
                <h3 className="text-xl font-semibold">Brand Contact</h3>
                <a
                  href={`tel:+234${BRAND.PHONE.replace(/\s/g, '')}`}
                  className="text-[#556B2F] hover:text-[#D4AF37] transition"
                >
                  {BRAND.PHONE}
                </a>
              </div>
            </motion.div>

            {/* EMAIL */}
            <motion.div variants={itemVariants} className="flex items-start gap-4">
              <Mail className="text-[#D4AF37] h-6 w-6 mt-1" />
              <div>
                <h3 className="text-xl font-semibold">Brand Email</h3>
                <a
                  href={`mailto:${BRAND.EMAIL}`}
                  className="text-[#556B2F] hover:text-[#D4AF37] transition"
                >
                  {BRAND.EMAIL}
                </a>
              </div>
            </motion.div>

            {/* WHATSAPP CTA */}
            <motion.div variants={itemVariants} className="pt-4">
              <a
                href={BRAND.WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-green text-green-700 px-6 py-3 rounded-full font-semibold text-lg hover:bg-green-600 transition shadow-lg shadow-green-500/30"
              >
                <MessageCircle size={24} />
                Chat via WhatsApp (Fastest)
              </a>
            </motion.div>

          </motion.div>

          {/* MAP */}
          <div className="mt-12">
            <h3 className="text-xl font-serif mb-4 text-[#556B2F]">Our Port Harcourt Base</h3>
            <div className="rounded-xl overflow-hidden shadow-xl border border-[#556B2F]/10 h-72">
              <iframe
                title="map"
                src="https://maps.google.com/maps?q=Port+Harcourt,+Rivers+State,+Nigeria&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="order-1 md:order-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 border-t-8 border-[#D4AF37]"
          >
            <h2 className="text-3xl font-serif text-[#556B2F] mb-6">Send a Direct Inquiry</h2>
            <p className="text-gray-600 mb-8">
              For general questions or partnership inquiries, use the form below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* NAME */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">Your Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              {/* MESSAGE */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">Message</label>
                <textarea
                  name="message"
                  rows="5"
                  required
                  value={form.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                ></textarea>
              </div>

              {/* SUBMIT */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-3 bg-[#556B2F] text-white rounded-xl font-semibold text-lg hover:bg-[#445725] transition flex items-center justify-center gap-2"
              >
                Send Message <Send size={18} />
              </motion.button>

            </form>
          </motion.div>

          {/* SOCIAL BELOW FORM */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col items-center mt-8 space-y-4"
          >
            <p className="text-gray-600 font-medium">Find us on social:</p>

            <div className="flex gap-6 mb-6">
              <a
                href={BRAND.INSTAGRAM}
                target="_blank"
                className="text-[#556B2F] hover:text-[#D4AF37]"
              >
                <Instagram size={30} />
              </a>

              <a
                href="https://www.tiktok.com/@thekramiebrand"
                target="_blank"
                className="text-[#556B2F] hover:text-[#D4AF37]"
              >
                <TikTokIcon className="w-7 h-7" />
              </a>

              <a
                href="/"
                className="text-[#556B2F] hover:text-[#D4AF37] flex items-center gap-1 font-semibold text-sm"
              >
                Shop Now <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
        <Sheet open={isCartOpen} onOpenChange={() => setIsCartOpen(false)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold">Shopping Cart</SheetTitle>
          </SheetHeader>

          <div className="mt-8 flex flex-col gap-4 h-[calc(100vh-12rem)] overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-muted-foreground">Your cart is empty</p>
                <Button onClick={() => setIsCartOpen(false)} variant="outline" className="mt-4">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="flex gap-3 p-3 border border-border rounded-lg">
                  <img src={item.image} className="h-20 w-20 object-cover rounded" />
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm font-semibold mt-1">₦{item.price.toLocaleString()}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>

                      <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-medium">Total</span>
                <span className="text-xl font-bold text-primary">₦{cartTotal.toLocaleString()}</span>
              </div>

              <Button className="w-full bg-accent text-accent-foreground" size="lg" onClick={handlePurchase}>
                Purchase
              </Button>

              <Button variant="ghost" className="w-full mt-2" onClick={() => setIsCartOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ============ FOOTER ============ */}
      <footer className="bg-[#556B2F] text-white pt-12 pb-6 mt-20">
        <div className="max-w-7xl mx-auto px-4">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

            {/* Brand */}
            <div>
              <h3 className="text-2xl font-serif text-[#D4AF37] tracking-wider">TKB</h3>
              <p className="text-gray-200 text-sm max-w-xs mt-3">
                Created with intention. Simplicity & care in every product.
              </p>

              <div className="flex gap-4 pt-4">
                <a href="https://www.instagram.com/thekramiebrand" className="hover:text-[#D4AF37]"><Instagram size={20} /></a>
                <a href="https://www.tiktok.com/@thekramiebrand" className="hover:text-[#D4AF37]"><TikTokIcon className="w-5 h-5" /></a>
                <a href="#"><Facebook size={20} /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[#D4AF37] font-semibold text-sm uppercase mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-gray-200">
                <li><a href="/shop" className="hover:text-[#D4AF37]">All Products</a></li>
                <li><a href="/shop?cat=face" className="hover:text-[#D4AF37]">Face Care</a></li>
                <li><a href="/shop?cat=wellness" className="hover:text-[#D4AF37]">Wellness</a></li>
                <li><a href="/shop?cat=sets" className="hover:text-[#D4AF37]">Bundles & Sets</a></li>
              </ul>
            </div>

            {/* Customer Care */}
            <div>
              <h4 className="text-[#D4AF37] font-semibold text-sm uppercase mb-4">Support</h4>
              <ul className="space-y-3 text-sm text-gray-200">
                <li className="flex gap-3"><MapPin size={16} className="text-[#D4AF37]" /> Port Harcourt, Nigeria</li>
                <li className="flex gap-3"><Phone size={16} className="text-[#D4AF37]" /> <a href="tel:+2348136345026">0813 634 5026</a></li>
                <li className="flex gap-3"><Mail size={16} className="text-[#D4AF37]" /> <a href="mailto:thekramiebrand@gmail.com">thekramiebrand@gmail.com</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-[#D4AF37] font-semibold text-sm uppercase mb-4">Join the list</h4>

              <form onSubmit={handleSubscribe} className="relative">
                <input 
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#445725] border border-[#556B2F] focus:border-[#D4AF37] text-white text-sm rounded-lg px-4 py-3"
                />

                <button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37]"
                >
                  {status === "loading" ? (
                    <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                  ) : status === "success" ? (
                    <span className="text-green-400 font-bold">✓</span>
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>

              {status === "success" && <p className="text-xs text-[#D4AF37] mt-2">Welcome to the family!</p>}
              {status === "error" && <p className="text-xs text-red-300 mt-2">Something went wrong. Try again.</p>}
            </div>

          </div>

          {/* Bottom */}
          <div className="border-t border-white/20 pt-6 flex justify-between text-xs text-gray-300">
            <p>© {new Date().getFullYear()} TKB — All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms</a>
              <a href="/shipping">Shipping & Returns</a>
            </div>
          </div>

        </div>
      </footer>
    </div>
    </>
  );
}
