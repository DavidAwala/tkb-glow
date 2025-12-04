import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, MapPin, Clock, Phone, DollarSign, Package, ArrowRight } from 'lucide-react';
import { Star } from 'lucide-react';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const orderId = searchParams.get('orderId');
  const provider = searchParams.get('provider'); // 'paystack' or 'payoneer'
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!orderId) {
      toast.error('No orderId provided');
      navigate('/');
      return;
    }
    (async () => {
      setLoading(true);
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const res = await fetch(`${serverUrl}/api/orders/${orderId}`);
      if (!res.ok) {
        toast.error('Could not load order');
        navigate('/');
        return;
      }
      const json = await res.json();
      setOrder(json);
      setLoading(false);
      
      // Clear the cart after successful order
      try {
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdate'));
      } catch (err) {
        console.error('Error clearing cart:', err);
      }
    })();
  }, [orderId, navigate]);

  const submitReview = async () => {
    if (!user) return toast.error('Please sign in to submit a review');
    if (!comment.trim()) return toast.error('Please write a comment');
    
    setSubmittingReview(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const res = await fetch(`${serverUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: order.order_items[0].product_id,
          user_id: user.id,
          rating,
          comment,
          order_id: order.id
        })
      });
      if (!res.ok) throw await res.json();
      toast.success('Thanks for your review');
      setComment('');
      setRating(5);
    } catch (err) {
      console.error(err);
      toast.error('Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Order not found</p>
          <Button onClick={() => navigate('/')} className="bg-[#D4AF37]">
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = order.total - (order.delivery_charge || 0);
  const shippingAddress = typeof order.shipping_address === 'string' 
    ? JSON.parse(order.shipping_address) 
    : order.shipping_address;

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        
        {/* Success Header */}
        <div className="text-center mb-8 pt-4">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#556B2F] mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">Thank you for your purchase. Your order has been received.</p>
        </div>

        {/* Order ID & Status */}
        <Card className="p-6 mb-6 border-l-4 border-[#D4AF37]">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order ID</p>
              <p className="font-mono text-sm font-semibold">{order.id?.slice(0, 12)}...</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
              <Badge className="capitalize bg-blue-100 text-blue-800">
                {order.status || 'pending'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Method</p>
              <p className="text-sm font-medium capitalize">{order.payment_provider || provider}</p>
            </div>
          </div>
        </Card>

        {/* Order Summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Summary
          </h2>
          
          <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{item.product_title}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">₦{(parseFloat(item.product_price) * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₦{subtotal.toLocaleString()}</span>
            </div>
            {order.delivery_charge > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Charge</span>
                <span className="font-medium">₦{parseFloat(order.delivery_charge).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-semibold">
              <span>Total</span>
              <span className="text-[#D4AF37]">₦{parseFloat(order.total).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Delivery Information */}
        {shippingAddress && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Delivery Address
            </h2>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-gray-600">
                    {shippingAddress.confirmed_address || shippingAddress.raw_address || 'Not provided'}
                  </p>
                </div>
              </div>

              {shippingAddress.phone && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-gray-600">{shippingAddress.phone}</p>
                  </div>
                </div>
              )}

              {shippingAddress.notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>Delivery Notes:</strong> {shippingAddress.notes}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Next Steps */}
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>What happens next?</strong> We'll prepare your order and send you updates via email. You can track your delivery once it ships.
          </AlertDescription>
        </Alert>

        {/* Review Section (if multiple items, let them choose which to review) */}
        {order.order_items && order.order_items.length > 0 && user && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-[#D4AF37] from-10% to-transparent">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Your Feedback</h2>
            <p className="text-sm text-gray-700 mb-4">
              Help us improve by leaving a review for <strong>{order.order_items[0]?.product_title}</strong>
            </p>

            <div className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRating(r)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        fill={r <= rating ? '#D4AF37' : 'none'}
                        stroke={r <= rating ? '#D4AF37' : '#ccc'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Your Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience with this product..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#D4AF37]"
                  rows={3}
                />
              </div>

              <Button
                onClick={submitReview}
                disabled={submittingReview || !comment.trim()}
                className="w-full bg-[#556B2F] text-white hover:bg-[#404a1f]"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </Card>
        )}

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Continue Shopping
          </Button>
          <Button
            onClick={() => navigate('/account/orders')}
            className="bg-[#D4AF37] text-white hover:bg-[#c99a2e]"
          >
            View Orders
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-1">Questions?</p>
              <p className="text-gray-600">Contact our support team anytime. We're here to help.</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900 mb-1">Track Your Order</p>
              <p className="text-gray-600">Check your email for tracking information and delivery updates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
