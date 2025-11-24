import { useState } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const SAMPLE_PRODUCTS = [
  {
    id: "1",
    name: "Hydrating Face Serum",
    price: 12500,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80",
  },
  {
    id: "2",
    name: "Glow Vitamin C Cream",
    price: 15000,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80",
  },
  {
    id: "3",
    name: "Calming Night Balm",
    price: 18000,
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&q=80",
  },
  {
    id: "4",
    name: "Daily Defense SPF 50",
    price: 11000,
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=500&q=80",
  },
  {
    id: "5",
    name: "Renewal Face Oil",
    price: 20000,
    image: "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=500&q=80",
  },
  {
    id: "6",
    name: "Gentle Cleansing Gel",
    price: 9500,
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&q=80",
  },
];

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleAddToCart = (product: typeof SAMPLE_PRODUCTS[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        toast.success("Quantity updated");
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success("Added to cart");
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast.success("Removed from cart");
  };

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Mini Hero */}
      <section className="container max-w-screen-2xl px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
          <div className="flex-1 space-y-3 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Glow daily. Feel aligned.
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Clean ingredients. Daily calm. Subtle glow.
            </p>
            <Button
              size="lg"
              onClick={scrollToProducts}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold mt-4"
            >
              Shop Bestsellers
            </Button>
          </div>
          <div className="w-full md:w-auto">
            <img
              src="https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=600&q=80"
              alt="Featured product"
              className="w-full md:w-80 h-64 md:h-80 object-cover rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="container max-w-screen-2xl px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Bestsellers</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {SAMPLE_PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              onAddToCart={() => handleAddToCart(product)}
              onViewDetails={() => toast.info("Product details coming soon")}
            />
          ))}
        </div>
      </section>

      {/* Sticky Bottom CTA - Mobile Only */}
      {cartItemCount > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-lg z-40">
          <Button
            size="lg"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            View Cart • ₦
            {cart
              .reduce((sum, item) => sum + item.price * item.quantity, 0)
              .toLocaleString()}
          </Button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16 py-8 bg-muted/20">
        <div className="container max-w-screen-2xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Shop</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Bestsellers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Sets</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-foreground">About</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Ingredients</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Connect</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/40 text-center text-xs text-muted-foreground">
            © 2025 TKB Beauty & Wellness. All rights reserved.
          </div>
        </div>
      </footer>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
};

export default Index;
