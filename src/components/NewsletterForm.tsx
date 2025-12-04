import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) return toast.error('Please enter a valid email');
    setLoading(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const res = await fetch(`${serverUrl}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Subscribe failed');
      toast.success('Subscribed to newsletter');
      setEmail('');
    } catch (err) {
      console.error(err);
      toast.error('Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex gap-2">
        <Input placeholder="you@example.com" value={email} onChange={(e:any) => setEmail(e.target.value)} />
        <Button onClick={handleSubscribe} disabled={loading}>{loading ? '...' : 'Subscribe'}</Button>
      </div>
      <p className="text-xs text-gray-500 mt-2">Get updates, promotions and new product launches.</p>
    </div>
  );
}
