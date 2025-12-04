import { useState } from 'react';
import { Facebook, Instagram, Mail, MapPin, Phone, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Adjust path

// Simple SVG Icon wrapper for TikTok since Lucide doesn't have it standard yet
const TikTokIcon = ({ className }: { className?: string }) => (
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

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email });

      if (error) {
        // Unique violation code in Postgres
        if (error.code === '23505') {
            alert('You are already subscribed!');
            setStatus('idle');
        } else {
            throw error;
        }
      } else {
        setStatus('success');
        setEmail('');
      }
    } catch (error) {
      console.error('Newsletter error:', error);
      setStatus('error');
    }
  };

  return (
    <footer className="bg-[#556B2F] text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          
          {/* 1. Brand Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-serif text-[#D4AF37] tracking-wider">TKB</h3>
            <p className="text-gray-200 text-sm leading-relaxed max-w-xs">
              Created with intention, simplicity, and care. Elevating your daily routines into moments of calm.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="https://www.instagram.com/thekramiebrand" target="_blank" rel="noreferrer" className="text-white hover:text-[#D4AF37] transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://www.tiktok.com/@thekramiebrand" target="_blank" rel="noreferrer" className="text-white hover:text-[#D4AF37] transition-colors">
                <TikTokIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-white hover:text-[#D4AF37] transition-colors">
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* 2. Quick Links */}
          <div>
            <h4 className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-200">
              <li><a href="/shop" className="hover:text-[#D4AF37] transition-colors">All Products</a></li>
              <li><a href="/shop?cat=face" className="hover:text-[#D4AF37] transition-colors">Face Care</a></li>
              <li><a href="/shop?cat=wellness" className="hover:text-[#D4AF37] transition-colors">Wellness</a></li>
              <li><a href="/shop?cat=sets" className="hover:text-[#D4AF37] transition-colors">Bundles & Sets</a></li>
            </ul>
          </div>

          {/* 3. Customer Care */}
          <div>
            <h4 className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-gray-200">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-[#D4AF37] mt-0.5 shrink-0" />
                <span>Port Harcourt, Rivers State, Nigeria.</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-[#D4AF37] shrink-0" />
                <a href="tel:+2348136345026">0813 634 5026</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-[#D4AF37] shrink-0" />
                <a href="mailto:thekramiebrand@gmail.com">thekramiebrand@gmail.com</a>
              </li>
            </ul>
          </div>

          {/* 4. Newsletter */}
          <div>
            <h4 className="text-[#D4AF37] font-semibold text-sm uppercase tracking-wider mb-4">Join the list</h4>
            <p className="text-xs text-gray-200 mb-4">
              Get 10% off your first order and exclusive access to new drops.
            </p>
            
            <form onSubmit={handleSubscribe} className="relative">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#445725] border border-[#556B2F] focus:border-[#D4AF37] text-white text-sm rounded-lg px-4 py-3 outline-none placeholder:text-gray-400"
                required
              />
              <button 
                type="submit" 
                disabled={status === 'loading' || status === 'success'}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#D4AF37] p-1.5 hover:bg-[#556B2F] rounded-md transition-colors"
              >
                {status === 'loading' ? (
                   <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                ) : status === 'success' ? (
                   <span className="text-green-400 text-xs font-bold">✓</span>
                ) : (
                   <Send size={16} />
                )}
              </button>
            </form>
            {status === 'success' && (
                <p className="text-xs text-[#D4AF37] mt-2">Welcome to the family!</p>
            )}
            {status === 'error' && (
                <p className="text-xs text-red-300 mt-2">Something went wrong. Try again.</p>
            )}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#FAFAF8]/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} The Kramie Brand. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-white">Privacy Policy</a>
            <a href="/terms" className="hover:text-white">Terms of Service</a>
            <a href="/shipping" className="hover:text-white">Shipping & Returns</a>
          </div>
        </div>
      </div>
    </footer>
  );
}