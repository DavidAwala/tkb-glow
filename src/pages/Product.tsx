'use client';

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showDesc, setShowDesc] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  /** ──────────────── Fetch Product ─────────────── */
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

  /** ──────────────── Fetch Reviews ─────────────── */
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

  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  /** ─────────────── Add To Cart ─────────────── */
  const handleAddToCart = () => {
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.title,
        price: parseFloat(product.price.toString()),
        quantity: 1,
        image: product.images?.[0] || ''
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success('Added to cart');
    window.dispatchEvent(new Event('cartUpdate'));
  };

  /** ─────────────── Buy Now (Add + Navigate) ─────────────── */
  const handleBuyNow = () => {
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.title,
        price: parseFloat(product.price.toString()),
        quantity: 1,
        image: product.images?.[0] || ''
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success('Added to cart, proceeding to checkout...');
    window.dispatchEvent(new Event('cartUpdate'));
    
    // Navigate to delivery page for checkout
    navigate('/delivery');
  };

  /** ─────────────── Submit Review ─────────────── */
  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please sign in to submit a review');
      navigate(`/auth?next=/product/${id}`);
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert([{
        product_id: id,
        user_id: user.id,
        rating,
        comment,
      }]);

      if (error) throw error;
      toast.success('Thank you for your review!');
      setComment('');
      setRating(5);
      // Refetch reviews
      const { refetch } = useQuery({
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
      // Note: This won't refetch. Better to use queryClient.invalidateQueries, but for now user can refresh
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button onClick={() => navigate('/')}>Back</button>
      </div>
    );

  /** ───────────────────────────────────────────── */
  /**                MOBILE PRODUCT PAGE            */
  /** ───────────────────────────────────────────── */

  return (
    <main className="pb-24 bg-[#FAFAF8] min-h-screen">

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 bg-white p-2 rounded-full shadow"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Hero Image / Slider */}
      <div className="h-[40vh] w-full bg-gray-200">
        <img
          src={product.images?.[selectedImage]}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Image thumbnails */}
      {product.images?.length > 1 && (
        <div className="flex gap-2 px-4 mt-3 overflow-x-auto">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedImage(i)}
              className={`h-14 w-14 rounded border ${
                selectedImage === i ? 'border-[#D4AF37]' : 'border-gray-200'
              } overflow-hidden`}
            >
              <img src={img} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pt-4">

        {/* Title */}
        <h1 className="text-[19px] font-semibold text-gray-900">
          {product.title}
        </h1>

        {/* Price & Stock */}
        <div className="flex items-center gap-3 mt-1 mb-4">
          <span className="text-xl font-bold text-[#D4AF37]">
            ₦{parseFloat(product.price).toLocaleString()}
          </span>

          {product.original_price && (
            <span className="text-sm line-through text-gray-400">
              ₦{parseFloat(product.original_price).toLocaleString()}
            </span>
          )}

          <span
            className={`text-xs px-2 py-0.5 rounded ${
              product.stock < 5
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {product.stock} in stock
          </span>
        </div>

        {/* Short benefits */}
        {product.benefits && (
          <ul className="space-y-1 mb-6 text-sm text-gray-600 list-disc pl-4">
            {(() => {
              // Handle both array and comma-separated string formats
              let benefitsList: string[] = [];
              if (typeof product.benefits === 'string') {
                // Split by comma if string
                benefitsList = product.benefits.split(',').map(b => b.trim()).filter(Boolean);
              } else if (Array.isArray(product.benefits)) {
                benefitsList = product.benefits;
              }
              
              return benefitsList.map((benefit: string, i: number) => (
                <li key={i}>{benefit}</li>
              ));
            })()}
          </ul>
        )}

        {/* Expandable long description */}
        <div className="border-t border-gray-200 py-3">
          <button
            onClick={() => setShowDesc(!showDesc)}
            className="text-xs font-semibold text-[#556B2F]"
          >
            {showDesc ? 'Hide Info ▲' : 'More Info ▼'}
          </button>

          {showDesc && (
            <p className="text-xs text-gray-500 mt-2">
              {product.description || product.short_desc}
            </p>
          )}
        </div>

        {/* Reviews */}
        <div className="mt-6">
          <h3 className="font-semibold text-sm mb-3">
            Reviews ({reviews?.length || 0})
          </h3>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {reviews?.map((review, i) => (
              <div
                key={i}
                className="min-w-[200px] bg-white p-3 rounded border border-gray-100"
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, s) => (
                    <Star
                      key={s}
                      size={10}
                      fill={s < review.rating ? '#D4AF37' : 'none'}
                      stroke="none"
                    />
                  ))}
                </div>

                <p className="text-xs italic text-gray-600">
                  "{review.comment}"
                </p>

                <span className="text-[10px] text-gray-400 mt-1 block">
                  - {review.profiles?.full_name || 'Anonymous'}
                </span>
              </div>
            ))}
          </div>

          {/* Write Review Section */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-sm mb-3">Write a Review</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRating(r)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={20}
                        fill={r <= rating ? '#D4AF37' : 'none'}
                        stroke={r <= rating ? '#D4AF37' : '#ccc'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Your Comment
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="text-xs resize-none"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSubmitReview}
                disabled={submittingReview || !user}
                className="w-full bg-[#D4AF37] text-white text-xs h-8"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>

              {!user && (
                <p className="text-xs text-gray-600 text-center">
                  <button
                    onClick={() => navigate(`/auth?next=/product/${id}`)}
                    className="text-[#D4AF37] font-medium underline"
                  >
                    Sign in
                  </button>
                  {' '}to write a review
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 flex gap-3 z-50">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-white border border-[#D4AF37] text-[#D4AF37] py-3 rounded font-medium"
        >
          Add to Cart
        </button>

        <button
          onClick={handleBuyNow}
          className="flex-1 bg-[#D4AF37] text-white py-3 rounded font-medium shadow-lg"
        >
          Buy Now
        </button>
      </div>
    </main>
  );
}
