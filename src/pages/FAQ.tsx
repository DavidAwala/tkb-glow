import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Search,
  Truck,
  Package,
  CreditCard,
  User,
  RefreshCw,
  MessageCircle,
  ChevronDown,
} from "lucide-react";

import Footer from "@/components/footer";
import { Header } from "@/components/Header";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CartDrawer } from "@/components/CartDrawer";
import { useAuth } from "@/hooks/useAuth";


const LOGO_URL = "/logo.png";

 interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}
export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  
  
  
  
  
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const categories = [
    {
      icon: HelpCircle,
      title: "General Questions",
      faqs: [
        {
          q: "What is TKB and what do you offer?",
          a: "TKB is a wellness and beauty brand focused on clean, natural and intentional self-care products that elevate your daily rituals.",
        },
        {
          q: "Are your products safe for all skin types?",
          a: "Yes. Our products are formulated using gentle, clean, and skin-friendly ingredients suitable for most skin types.",
        },
        {
          q: "Where are you located?",
          a: "We are based in Port Harcourt, Rivers State, Nigeria.",
        },
      ],
    },
    {
      icon: Truck,
      title: "Shipping & Delivery",
      faqs: [
        {
          q: "Do you offer nationwide delivery?",
          a: "Yes, we deliver to all states in Nigeria using trusted logistics partners.",
        },
        {
          q: "How long does delivery take?",
          a: "Standard delivery takes 2–5 working days depending on your state.",
        },
        {
          q: "Do you offer same-day delivery?",
          a: "Yes, same-day delivery is available within Port Harcourt for orders placed before 12 PM.",
        },
      ],
    },
    {
      icon: Package,
      title: "Product Information",
      faqs: [
        {
          q: "Are your products organic?",
          a: "We use high-quality natural ingredients sourced responsibly, with no harsh chemicals.",
        },
        {
          q: "How do I store my skincare products?",
          a: "Store in a cool, dry place away from direct sunlight to maintain product quality.",
        },
        {
          q: "Do your products expire?",
          a: "Yes. Most items have a 12–18 month shelf life depending on the formula.",
        },
      ],
    },
    {
      icon: CreditCard,
      title: "Payments",
      faqs: [
        {
          q: "What payment methods do you accept?",
          a: "We accept bank transfer, debit cards, and secure online payment via Paystack.",
        },
        {
          q: "Is my payment information secure?",
          a: "Yes. All payments are encrypted and processed using secure payment gateways.",
        },
        {
          q: "Can I pay on delivery?",
          a: "Pay on delivery is available within Port Harcourt for selected orders.",
        },
      ],
    },
    {
      icon: User,
      title: "Account & Orders",
      faqs: [
        {
          q: "Do I need an account to shop?",
          a: "No. You can checkout as a guest, but having an account helps track your orders easily.",
        },
        {
          q: "How do I track my order?",
          a: "You will receive a tracking link or SMS once your order has been dispatched.",
        },
        {
          q: "Can I cancel or change my order?",
          a: "Orders can be modified within 1 hour of placing them. Contact support immediately.",
        },
      ],
    },
    {
      icon: RefreshCw,
      title: "Returns & Refunds",
      faqs: [
        {
          q: "Do you accept returns?",
          a: "Yes, if the product is unused and returned within 48 hours of delivery.",
        },
        {
          q: "Do you offer refunds?",
          a: "Refunds are issued for wrongly delivered or damaged items after verification.",
        },
        {
          q: "How long do refunds take?",
          a: "Refunds are processed within 3–7 working days.",
        },
      ],
    },
  ];

  const filtered = search.trim()
    ? categories.map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter((f) =>
          f.q.toLowerCase().includes(search.toLowerCase())
        ),
      }))
    : categories;

  return (
    <>
    <div className="bg-[#FAFAF8] min-h-screen pb-24">
         <Header 
                cartItemCount={cartItemCount} 
                onCartClick={() => setIsCartOpen(true)}
                isAdmin={isAdmin}
              />
      {/* HEADER */}
      <section className="text-center py-20 bg-[#556B2F] text-white relative overflow-hidden">
        <img
          src={LOGO_URL}
          alt="logo"
          className="absolute opacity-10 inset-0 m-auto w-80"
        />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-serif mb-4 relative z-10"
        >
          Frequently Asked Questions
        </motion.h1>

        <p className="opacity-90 max-w-xl mx-auto relative z-10">
          Everything you need to know about TKB, shopping, payment, and
          delivery.
        </p>
      </section>

      {/* SEARCH BAR */}
      <div className="max-w-3xl mx-auto mt-10 px-4">
        <div className="flex items-center bg-white shadow-lg rounded-full px-5 py-3">
          <Search className="text-[#556B2F]" />
          <input
            className="flex-1 ml-3 outline-none text-gray-700"
            placeholder="Search for a question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* FAQ LIST */}
      <div className="max-w-5xl mx-auto mt-16 px-6 space-y-16">
        {filtered.map((cat, idx) => (
          <div key={idx}>
            <div className="flex items-center gap-3 mb-6">
              <cat.icon className="text-[#556B2F]" size={28} />
              <h2 className="text-2xl md:text-3xl font-serif text-[#556B2F]">
                {cat.title}
              </h2>
            </div>

            <div className="space-y-4">
              {cat.faqs.map((item, i) => {
                const isOpen = openIndex === `${idx}-${i}`;
                return (
                  <motion.div
                    key={i}
                    layout
                    className="bg-white p-5 rounded-xl shadow-md border border-[#D4AF37]/20"
                  >
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() =>
                        setOpenIndex(isOpen ? null : `${idx}-${i}`)
                      }
                    >
                      <h3 className="text-lg font-medium text-gray-700">
                        {item.q}
                      </h3>
                      <ChevronDown
                        className={`transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {isOpen && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 text-gray-600 leading-relaxed"
                      >
                        {item.a}
                      </motion.p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* STILL NEED HELP */}
      <div className="text-center mt-20">
        <MessageCircle className="mx-auto text-[#556B2F]" size={48} />
        <h3 className="text-2xl font-serif mt-4 text-[#556B2F]">
          Still need help?
        </h3>
        <p className="text-gray-600 mt-2">
          Our support team is here 24/7 to assist you.
        </p>
        <a
          href="/contact"
          className="inline-block mt-6 bg-[#D4AF37] text-white px-8 py-3 rounded-full font-medium hover:bg-white hover:text-[#556B2F] border border-[#D4AF37] transition-all"
        >
          Contact Support
        </a>
      </div>
    </div>
     <CartDrawer
                    isOpen={isCartOpen}
                    onClose={() => setIsCartOpen(false)}
                    items={cartItems}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeItem}
                  />
          <Footer/>
          </>
  );
}
