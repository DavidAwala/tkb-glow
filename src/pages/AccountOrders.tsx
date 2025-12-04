import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AccountOrders() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth');
      return;
    }

    (async () => {
      setLoadingOrders(true);
      try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const resp = await fetch(`${serverUrl}/api/orders?userId=${user.id}`);
      if (!resp.ok) throw new Error('Failed to fetch orders');
      const data = await resp.json();
      setOrders(data || []);
      } catch (err) {
        console.error(err);
        toast.error('Could not load orders');
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Your Orders</h1>
        {loadingOrders ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 && <Card className="p-6">You have no orders yet.</Card>}
            {orders.map((o:any) => (
              <Card className="p-4 flex justify-between items-center" key={o.id}>
                <div>
                  <p className="font-medium">Order {o.id?.slice(0,8)}...</p>
                  <p className="text-sm text-muted-foreground">{o.order_items?.length || 0} item(s) • {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => navigate(`/order/${o.id}`)}>View</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
