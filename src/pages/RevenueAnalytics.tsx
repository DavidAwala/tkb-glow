import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { toast } from 'sonner';

export default function RevenueAnalytics() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Only admins can view analytics
  useEffect(() => {
    if (!isAdmin) {
      toast.error('Admin access required');
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Fetch all orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['revenue-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });

  // Fetch products for product revenue breakdown
  const { data: products } = useQuery({
    queryKey: ['revenue-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });

  if (ordersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Calculate stats
  const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const totalDeliveryCharges = orders?.reduce((sum, o) => sum + parseFloat(o.delivery_charge || 0), 0) || 0;
  const subtotalRevenue = totalRevenue - totalDeliveryCharges;

  // Revenue by status
  const revenueByStatus = [
    {
      name: 'Completed',
      value: orders?.filter(o => o.status === 'delivered').reduce((s, o) => s + parseFloat(o.total), 0) || 0
    },
    {
      name: 'In Progress',
      value: orders?.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).reduce((s, o) => s + parseFloat(o.total), 0) || 0
    },
    {
      name: 'Cancelled',
      value: orders?.filter(o => o.status === 'cancelled').reduce((s, o) => s + parseFloat(o.total), 0) || 0
    }
  ];

  // Daily revenue
  const dailyRevenue = orders?.reduce((acc: any, order: any) => {
    const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find((d: any) => d.date === date);
    if (existing) {
      existing.revenue += parseFloat(order.total || 0);
      existing.count += 1;
    } else {
      acc.push({ date, revenue: parseFloat(order.total || 0), count: 1 });
    }
    return acc;
  }, []) || [];

  // Revenue by product (top 10)
  const revenueByProduct = orders?.flatMap((order: any) =>
    order.order_items?.map((item: any) => ({
      product: item.product_title,
      revenue: item.product_price * item.quantity,
      quantity: item.quantity
    })) || []
  ).reduce((acc: any, item: any) => {
    const existing = acc.find((p: any) => p.product === item.product);
    if (existing) {
      existing.revenue += item.revenue;
      existing.quantity += item.quantity;
    } else {
      acc.push(item);
    }
    return acc;
  }, [])
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10) || [];

  // Order value distribution
  const orderDistribution = [
    { range: '₦0-1K', count: orders?.filter(o => parseFloat(o.total) < 1000).length || 0 },
    { range: '₦1K-5K', count: orders?.filter(o => parseFloat(o.total) >= 1000 && parseFloat(o.total) < 5000).length || 0 },
    { range: '₦5K-10K', count: orders?.filter(o => parseFloat(o.total) >= 5000 && parseFloat(o.total) < 10000).length || 0 },
    { range: '₦10K+', count: orders?.filter(o => parseFloat(o.total) >= 10000).length || 0 }
  ];

  const COLORS = ['#556B2F', '#D4AF37', '#FF6B6B', '#4ECDC4'];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
        </Button>

        <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-olive" />
          Revenue Analytics
        </h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-gold">₦{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2">{totalOrders} orders</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Product Sales</p>
            <p className="text-3xl font-bold">₦{subtotalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2">{((subtotalRevenue / totalRevenue) * 100).toFixed(1)}% of total</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Delivery Charges</p>
            <p className="text-3xl font-bold text-olive">₦{totalDeliveryCharges.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2">{((totalDeliveryCharges / totalRevenue) * 100).toFixed(1)}% of total</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Average Order</p>
            <p className="text-3xl font-bold">₦{(totalRevenue / totalOrders).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2">Per transaction</p>
          </Card>
        </div>

        {/* Daily Revenue Trend */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Daily Revenue Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} name="Daily Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue by Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" /> Revenue by Order Status
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₦${value.toLocaleString()}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueByStatus.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Order Value Distribution */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Order Value Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#556B2F" name="Number of Orders" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Products by Revenue */}
        {revenueByProduct.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Top Products by Revenue</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={revenueByProduct}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="product" type="category" width={190} />
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#D4AF37" name="Revenue (₦)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Revenue Details Table */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Breakdown by Status</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-semibold">Status</th>
                  <th className="text-right py-2 px-4 font-semibold">Orders</th>
                  <th className="text-right py-2 px-4 font-semibold">Revenue</th>
                  <th className="text-right py-2 px-4 font-semibold">Avg Order Value</th>
                  <th className="text-right py-2 px-4 font-semibold">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
                  const statusOrders = orders?.filter(o => o.status === status) || [];
                  const statusRevenue = statusOrders.reduce((s, o) => s + parseFloat(o.total), 0);
                  return (
                    <tr key={status} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Badge className="capitalize">{status}</Badge>
                      </td>
                      <td className="text-right py-3 px-4">{statusOrders.length}</td>
                      <td className="text-right py-3 px-4 font-semibold text-gold">₦{statusRevenue.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">
                        ₦{statusOrders.length > 0 ? (statusRevenue / statusOrders.length).toLocaleString() : '0'}
                      </td>
                      <td className="text-right py-3 px-4">{((statusRevenue / totalRevenue) * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
