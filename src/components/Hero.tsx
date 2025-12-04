import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShoppingBag, Star, Loader2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Type definition based on your SQL schema
interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  short_desc: string;
  category: string;
  featured: boolean;
}

export default function Hero() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Fetch Featured Products
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, price, images, short_desc, category, featured')
          .eq('featured', true)
          .limit(5); // Fetch up to 5 for the carousel

        if (error) throw error;
        if (data) setProducts(data);
      } catch (error) {
        console.error('Error fetching hero products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  // 2. Auto-Play Carousel Logic
  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 6000); // Change slide every 6 seconds
    return () => clearInterval(timer);
  }, [products.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <section className="h-[60vh] w-full flex items-center justify-center bg-[#FAFAF8]">
        <Loader2 className="animate-spin text-[#556B2F]" size={32} />
      </section>
    );
  }

  // Fallback if no featured products found
  if (products.length === 0) return null;

  const currentProduct = products[currentIndex];

  return (
    <section className="bg-[#FAFAF8] w-full pt-8 pb-16 md:pt-12 md:pb-24 overflow-hidden relative">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-2/3 h-full bg-[#556B2F]/5 rounded-bl-[100px] -z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* --- LEFT: HERO TEXT --- */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left space-y-6 md:pr-10"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="text-[#D4AF37] w-4 h-4" />
              <span className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase">
                Beauty • Wellness • Balance
              </span>
            </div>

            <h1 className="text-[#556B2F] text-5xl md:text-6xl lg:text-7xl font-serif font-medium leading-[1.1]">
              Glow daily. <br />
              <span className="italic opacity-80 font-light">Feel aligned.</span>
            </h1>
            
            <p className="text-gray-600 text-base md:text-lg max-w-md leading-relaxed">
              Elevate your rituals with our curated bestsellers. 
              Clean ingredients designed to help you look good, feel good, and show up as your best self.
            </p>
            
<div className="flex flex-wrap gap-4 pt-4">
  <button
    onClick={() => {
      const el = document.getElementById("products");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }}
    className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-8 py-4 rounded-full text-sm font-semibold hover:bg-[#445725] transition-all duration-300 shadow-xl shadow-[#556B2F]/20 hover:shadow-2xl hover:-translate-y-1"
  >
    Shop All Products <ArrowRight size={16} />
  </button>
</div>


            {/* Carousel Indicators (Mobile/Desktop) */}
            <div className="flex gap-2 pt-8">
              {products.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? "w-8 bg-[#D4AF37]" : "w-2 bg-[#556B2F]/20 hover:bg-[#556B2F]/40"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* --- RIGHT: PRODUCT CAROUSEL --- */}
          <div className="relative h-[550px] md:h-[600px] w-full flex items-center justify-center">
            
            {/* Navigation Arrows */}
            <button 
              onClick={prevSlide}
              className="absolute left-2 md:-left-6 z-20 bg-white/80 backdrop-blur hover:bg-white text-[#556B2F] p-3 rounded-full shadow-lg transition-all hover:scale-110"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-2 md:-right-6 z-20 bg-white/80 backdrop-blur hover:bg-white text-[#556B2F] p-3 rounded-full shadow-lg transition-all hover:scale-110"
            >
              <ChevronRight size={20} />
            </button>

            <AnimatePresence mode='wait'>
              <motion.div 
                key={currentProduct.id}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-sm mx-auto h-full"
              >
                {/* Product Card Container */}
                <div className="relative h-full w-full bg-white rounded-t-[100px] rounded-b-[30px] shadow-2xl overflow-hidden border border-[#556B2F]/10 group">
                  
                  {/* Image Area */}
                  <div className="h-[75%] w-full relative bg-[#FAFAF8] overflow-hidden">
                    {currentProduct.images && currentProduct.images[0] ? (
                      <img 
                        src={currentProduct.images[0]} 
                        alt={currentProduct.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#556B2F]/40 bg-gray-100">
                        No Image
                      </div>
                    )}
                    
                    {/* Floating Category Tag */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-[#556B2F] shadow-sm">
                      {currentProduct.category || "Bestseller"}
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white h-[25%] p-6 flex flex-col justify-between z-10">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-[#2C2C2C] font-serif text-xl line-clamp-1">
                          {currentProduct.title}
                        </h3>
                        <div className="flex text-[#D4AF37] text-xs gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                        </div>
                      </div>
                      <p className="text-gray-500 text-xs line-clamp-1 mb-3">
                        {currentProduct.short_desc || "Experience the glow of natural ingredients."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xl font-semibold text-[#556B2F]">
                        {formatCurrency(currentProduct.price)}
                      </span>
                      
                      {/* Direct Link to Product */}
                      <Link 
                        to={`/product/${currentProduct.id}`}
                        className="flex items-center gap-2 bg-[#D4AF37] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#b8962e] transition-colors"
                      >
                        Buy Now <ShoppingBag size={14} />
                      </Link>
                    </div>
                  </div>
                  
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Background blur effect behind carousel for premium feel */}
            <div className="absolute inset-0 bg-[#D4AF37]/20 blur-[60px] rounded-full z-0 scale-75 animate-pulse" />
          </div>

        </div>
      </div>
    </section>
  );
}