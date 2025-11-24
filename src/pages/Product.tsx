import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .eq('product_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.title,
        price: parseFloat(product.price.toString()),
        quantity,
        image: product.images[0]
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success('Added to cart');
    window.dispatchEvent(new Event('cartUpdate'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Button onClick={() => navigate('/')}>Back to shop</Button>
        </div>
      </div>
    );
  }

  const avgRating = reviews?.length 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to shop
        </button>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4">
              <img
                src={product.images[selectedImage] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded border-2 overflow-hidden ${
                      selectedImage === idx ? 'border-gold' : 'border-border'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              {product.title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-4">
              {product.short_desc}
            </p>

            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(avgRating)
                        ? 'fill-gold text-gold'
                        : 'text-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {reviews?.length || 0} reviews
              </span>
            </div>

            <div className="text-3xl font-bold text-gold mb-6">
              ₦{parseFloat(product.price.toString()).toLocaleString()}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-border rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-accent"
                >
                  −
                </button>
                <span className="px-4 py-2 border-x border-border">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-accent"
                >
                  +
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-gold hover:bg-gold/90"
              >
                Add to cart
              </Button>
            </div>

            <div className="border-t border-border pt-6 mb-6">
              <p className="text-sm text-muted-foreground">
                {product.description}
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Free shipping on orders over ₦20,000</p>
              <p>30-day return policy</p>
            </div>
          </div>
        </div>

        {reviews && reviews.length > 0 && (
          <div className="mt-16 border-t border-border pt-16">
            <h2 className="text-2xl font-semibold mb-8">Reviews</h2>
            <div className="space-y-6">
              {reviews.map((review: any) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'fill-gold text-gold' : 'text-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      {review.profiles?.full_name || 'Anonymous'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}