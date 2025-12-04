import { useEffect, useRef, useState } from 'react';
import Footer from "@/components/footer";
import { Header } from "@/components/Header";
import { motion, useScroll, useTransform } from 'framer-motion';
import { Leaf, Sparkles, Heart, Droplets } from 'lucide-react';


import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CartDrawer } from "@/components/CartDrawer";
import { useAuth } from "@/hooks/useAuth";







// --- ASSETS ---
// Make sure you have your logo at public/logo.png
const LOGO_URL = "/logo.png"; 

// Premium Image URLs (Unsplash)
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop", // Serene woman/spa vibe
  ingredients: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=2070&q=80",  // natural cosmetic oil / texture
lifestyle:   "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=2070&q=80",  // natural spa / botanical beauty
 texture: "https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=2073&auto=format&fit=crop" // Olive branch/Greenery
};

// --- COMPONENTS ---

// 1. The "Stamped" Logo Background Pattern
const LogoPattern = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.03]">
    <div 
      className="w-full h-full"
      style={{
        backgroundImage: `url(${LOGO_URL})`,
        backgroundSize: '150px',
        backgroundRepeat: 'repeat',
        filter: 'grayscale(100%)',
        transform: 'rotate(-15deg) scale(1.5)'
      }}
    />
  </div>
);

// 2. Decorative Leaf
const DecorationLeaf = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, rotate: -10 }}
    whileInView={{ opacity: 0.2, rotate: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 1, delay }}
    className={`absolute pointer-events-none text-[#556B2F] ${className}`}
  >
    <Leaf size={120} strokeWidth={0.5} />
  </motion.div>
);
  interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}
export default function About() {

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });





  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const categories = ["All", "Face", "Wellness", "Sets"];

  useEffect(() => {
    const loadCart = () => {
      const saved = localStorage.getItem('cart');
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    };
    
    loadCart();
    
    const handleCartUpdate = () => loadCart();
    window.addEventListener('cartUpdate', handleCartUpdate);
    
    return () => window.removeEventListener('cartUpdate', handleCartUpdate);
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems(items =>
      items.map(item => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const handleAddToCart = (product: any) => {
    setCartItems(items => {
      const existing = items.find(item => item.id === product.id);
      if (existing) {
        return items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...items, {
        id: product.id,
        name: product.title,
        price: parseFloat(product.price.toString()),
        quantity: 1,
        image: product.images[0]
      }];
    });
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div ref={containerRef} className="bg-[#FAFAF8] min-h-screen relative overflow-hidden">
       <Header 
              cartItemCount={cartItemCount} 
              onCartClick={() => setIsCartOpen(true)}
              isAdmin={isAdmin}
            />
      {/* --- HERO SECTION --- */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax */}
        <motion.div 
          style={{ y: y1 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={IMAGES.hero} 
            alt="TKB Wellness" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-[#556B2F]/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FAFAF8]" />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="block text-[#D4AF37] font-bold tracking-[0.3em] text-sm md:text-base mb-4 uppercase">
              Beauty • Wellness • Balance
            </span>
            <h1 className="text-white text-5xl md:text-7xl font-serif mb-6 leading-tight">
              Intention. <br />
              <span className="italic font-light">Simplicity.</span> Care.
            </h1>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* --- NARRATIVE SECTION --- */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <LogoPattern /> {/* Stamped Logo Background */}
        <DecorationLeaf className="-top-10 -left-10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Image Grid */}
          <div className="relative">
            <motion.div 
              style={{ y: y2 }}
              className="grid grid-cols-2 gap-4"
            >
              <img 
                src={IMAGES.ingredients} 
                alt="Natural textures" 
                className="w-full h-64 object-cover rounded-tl-[4rem] rounded-br-2xl shadow-xl border-4 border-white" 
              />
              <img 
                src={IMAGES.lifestyle} 
                alt="TKB Lifestyle" 
                className="w-full h-64 object-cover rounded-tr-2xl rounded-bl-[4rem] shadow-xl border-4 border-white mt-12" 
              />
            </motion.div>
            {/* Floating Gold Box */}
            <div className="absolute inset-0 border border-[#D4AF37]/30 -m-4 rounded-[3rem] pointer-events-none" />
          </div>

          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h2 className="text-[#556B2F] text-3xl md:text-4xl font-serif">
              Elevating everyday rituals.
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              TKB is a beauty and wellness brand created with intention, simplicity, and care. 
              We believe that everyone deserves to feel confident, nurtured, and beautifully aligned in their own skin.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg">
              Our products are crafted to elevate daily routines into moments of calm, luxury, and self-connection. 
              Soft, effective, and timeless, our products support your natural radiance from the inside out.
            </p>
            
            <div className="pt-4">
              <div className="inline-block border-b-2 border-[#D4AF37] text-[#556B2F] font-serif italic text-xl pb-1">
                The Kramie Brand
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- MISSION STATEMENT (Dark Block) --- */}
      <section className="bg-[#556B2F] py-20 relative overflow-hidden text-center text-white px-4">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
        
        <div className="max-w-3xl mx-auto relative z-10 space-y-8">
          <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto" />
          
          <h2 className="text-3xl md:text-5xl font-serif leading-snug">
            "We are a reminder that growth is beautiful, confidence is power, and self-care is a lifestyle."
          </h2>
          
          <p className="text-[#D4AF37] text-lg tracking-wide uppercase font-medium">
            Our Mission
          </p>
          <p className="text-gray-100 text-lg md:text-xl font-light">
            To help you look good, feel good, and show up as your best self every day.
          </p>
        </div>
      </section>

      {/* --- PILLARS / VALUES --- */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 relative">
        <LogoPattern />
        <DecorationLeaf className="bottom-0 right-0 rotate-180" delay={0.5} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Droplets,
              title: "Clean Ingredients",
              desc: "Focusing on high-quality formulations designed to be soft, effective, and timeless."
            },
            {
              icon: Sparkles,
              title: "Natural Radiance",
              desc: "Transforming the ordinary into moments of glow, supporting your beauty from the inside out."
            },
            {
              icon: Heart,
              title: "Self-Connection",
              desc: "Crafted to elevate your daily routines into moments of calm, luxury, and confidence."
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2, duration: 0.6 }}
              className="bg-white p-8 rounded-2xl shadow-lg border-b-4 border-[#D4AF37] group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-14 h-14 bg-[#556B2F]/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#556B2F] transition-colors duration-300">
                <item.icon className="text-[#556B2F] group-hover:text-[#D4AF37] transition-colors duration-300" size={28} />
              </div>
              <h3 className="text-[#556B2F] text-xl font-serif mb-3">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- CLOSING --- */}
      <section className="relative h-[60vh] md:h-[50vh] flex items-center justify-center overflow-hidden">
        <img 
          src={IMAGES.texture} 
          alt="Olive Texture" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#556B2F]/80" />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center p-8 border border-[#D4AF37]/50 m-4 max-w-2xl bg-[#556B2F]/40 backdrop-blur-sm"
        >
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-4">
            Welcome to TKB
          </h2>
          <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mb-6" />
          <p className="text-gray-100 mb-8 max-w-md mx-auto">
            Port Harcourt, Rivers State, Nigeria.
          </p>
          <a 
            href="/" 
            className="inline-block bg-[#D4AF37] text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-[#556B2F] transition-all duration-300"
          >
            Start Your Journey
          </a>
        </motion.div>
      </section>
      <CartDrawer
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              items={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
            />
    <Footer/>
    </div>
  );
}