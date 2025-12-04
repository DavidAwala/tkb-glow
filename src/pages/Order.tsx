import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, MapPin, Clock, Phone, Package } from 'lucide-react';

export default function Order() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      toast.error('Order id missing');
      navigate('/');
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const serverUrl = import.meta.env.VITE_SERVER_URL || '';
        const resp = await fetch(`${serverUrl}/api/orders/${id}`);
        if (!resp.ok) {
          toast.error('Could not load order');
          navigate('/');
          return;
        }
        const json = await resp.json();
        setOrder(json);
      } catch (err) {
        console.error(err);
        toast.error('Error loading order');
        navigate('/');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

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
          <Button onClick={() => navigate('/')} className="bg-[#D4AF37]">Back to Shop</Button>
        </div>
      </div>
    );
  }

  const subtotal = order.total - (order.delivery_charge || 0);
  const shippingAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
  const deliveryMessage = (() => {
    const s = (order.status || 'pending').toLowerCase();
    if (s === 'pending') return 'We will notify you when your order ships.';
    if (s === 'processing') return 'Your order is being prepared.';
    if (s === 'shipped' || s === 'out_for_delivery') return 'Your order is on the way!';
    if (s === 'delivered') return 'Your order has been delivered.';
    if (s === 'cancelled') return 'This order has been cancelled.';
    if (s === 'refunded') return 'This order has been refunded.';
    return 'We will notify you of delivery updates.';
  })();

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4 pb-24">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-8 pt-4">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:underline">← Back</button>
          </div>
          <div className="text-center flex-1">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-50 rounded-full p-4">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#556B2F] mb-2">Order #{order.id?.slice(0, 12)}...</h1>
          <p className="text-gray-600">View invoice, items and payment status for your order.</p>
          </div>
          <div style={{width:72}} />
        </div>

        <Card className="p-6 mb-6 border-l-4 border-[#D4AF37]">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order ID</p>
              <p className="font-mono text-sm font-semibold">{order.id?.slice(0, 12)}...</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
              <Badge className="capitalize bg-blue-100 text-blue-800">{order.status || 'pending'}</Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Method</p>
              <p className="text-sm font-medium capitalize">{order.payment_provider || 'n/a'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5" /> Order Summary</h2>

          <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{item.product_title}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">₦{(parseFloat(item.product_price) * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

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

        {shippingAddress && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" /> Delivery Address</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-gray-600">{shippingAddress.confirmed_address || shippingAddress.raw_address || 'Not provided'}</p>
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
            </div>
          </Card>
        )}

        {order.tracking_info && Array.isArray(order.tracking_info) && order.tracking_info.length > 0 && (
          <Card className="p-6 mb-6 border-l-4 border-teal-500">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" /> Delivery Tracking
            </h2>
            <div className="space-y-4">
              {order.tracking_info.map((track: any, idx: number) => (
                <div key={idx} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                    {idx < order.tracking_info.length - 1 && (
                      <div className="w-0.5 h-12 bg-teal-200 my-1"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm capitalize">{track.status?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(track.timestamp).toLocaleDateString()} {new Date(track.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{track.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>Delivery ETA</strong> — {deliveryMessage}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => navigate('/')} className="border-gray-300 text-gray-700 hover:bg-gray-50">Back to Shop</Button>
          <Button onClick={() => navigate('/account/orders')} className="bg-[#D4AF37] text-white hover:bg-[#c99a2e]">View Orders</Button>
        </div>

      </div>
    </div>
  );
}
