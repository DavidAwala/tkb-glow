import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const Index = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemCount={cartItemCount} 
        onCartClick={() => setIsCartOpen(true)}
        isAdmin={isAdmin}
      />
      
      {/* Mini Hero */}
      <section className="container mx-auto px-4 pt-24 pb-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=800" 
              alt="Product"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-lg text-muted-foreground mb-4">Glow daily. Feel aligned.</p>
          <div className="flex gap-3 justify-center">
            <Button 
              size="lg" 
              className="bg-gold hover:bg-gold/90 text-accent-foreground"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Shop Bestsellers
            </Button>
            {!user && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="container mx-auto px-4 pb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className={selectedCategory === cat ? "bg-olive hover:bg-olive/90" : ""}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading products...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.title}
                price={parseFloat(product.price.toString())}
                image={product.images[0]}
                benefit={product.short_desc}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sticky Bottom CTA (mobile) */}
      {cartItemCount > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button
            className="w-full bg-gold hover:bg-gold/90 text-accent-foreground"
            onClick={() => setIsCartOpen(true)}
          >
            View Cart • ₦{cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}
          </Button>
        </div>
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
      />
    </div>
  );
};

export default Index;