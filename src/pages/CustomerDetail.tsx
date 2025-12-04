import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, ShoppingCart, DollarSign, Calendar, User, Mail, Phone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function CustomerDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Only admins can view customer details
  useEffect(() => {
    if (!isAdmin) {
      toast.error('Admin access required');
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Fetch customer profile
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  // Fetch customer orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  // Fetch customer reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['customer-reviews', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  if (customerLoading || ordersLoading || reviewsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <p className="text-center text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  // Calculate customer stats
  const totalSpent = orders?.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const totalItems = orders?.reduce((sum, o) => sum + (o.order_items?.length || 0), 0) || 0;
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Prepare chart data
  const spendByMonth = orders?.reduce((acc: any, order: any) => {
    const date = new Date(order.created_at);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const existing = acc.find((d: any) => d.month === monthKey);
    if (existing) {
      existing.spend += parseFloat(order.total || 0);
      existing.orders += 1;
    } else {
      acc.push({ month: monthKey, spend: parseFloat(order.total || 0), orders: 1 });
    }
    return acc;
  }, []) || [];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customers
        </Button>

        {/* Customer Info Card */}
        <Card className="p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Profile Info */}
            <div>
              <h1 className="text-3xl font-bold mb-6">{customer.full_name || 'Guest'}</h1>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {new Date(customer.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-olive/10 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="w-6 h-6 text-olive" />
                </div>
                <p className="text-2xl font-bold text-gold">₦{totalSpent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
              <div className="bg-olive/10 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <ShoppingCart className="w-6 h-6 text-olive" />
                </div>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
              <div className="bg-olive/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">₦{avgOrderValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Avg Order</p>
              </div>
              <div className="bg-olive/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-xs text-muted-foreground">Items Bought</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Spending Chart */}
        {spendByMonth.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Spending Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spendByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="spend" fill="#D4AF37" name="Spending (₦)" />
                <Bar dataKey="orders" fill="#556B2F" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Orders Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Purchase History
          </h2>
          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gold">₦{parseFloat(order.total).toLocaleString()}</p>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.order_items?.length} item(s)
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="ml-2">
                        • {item.product_title} × {item.quantity}
                      </div>
                    ))}
                  </div>
                  {order.delivery_charge > 0 && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      Delivery Charge: <span className="font-medium text-gold">₦{parseFloat(order.delivery_charge).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No orders yet</p>
          )}
        </Card>

        {/* Reviews Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Reviews</h2>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{(review.products as any)?.title || 'Product'}</p>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-lg ${i < review.rating ? 'text-gold' : 'text-gray-300'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No reviews yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}
