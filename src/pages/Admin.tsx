'use client';

import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle, Plus, Edit2, Trash2, ChevronRight, Search, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

// Simple Promo manager component (inline)
function PromoManager({ promos, onChange }: any) {
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percent', value: 0, apply_to_delivery: false, min_subtotal: 0, max_uses: null, expires_at: '' });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.code) return;
    setCreating(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const resp = await fetch(`${serverUrl}/api/promos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' },
        body: JSON.stringify({ ...form, code: form.code.toUpperCase(), expires_at: form.expires_at || null })
      });
      if (!resp.ok) throw new Error(await resp.text());
      toast.success('Promo created');
      setForm({ code: '', description: '', discount_type: 'percent', value: 0, apply_to_delivery: false, min_subtotal: 0, max_uses: null, expires_at: '' });
      onChange && onChange();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create promo');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded border">
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        <Input placeholder="Discount value" type="number" value={form.value as any} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
        <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="p-2 border rounded">
          <option value="percent">Percent</option>
          <option value="fixed">Fixed (NGN)</option>
        </select>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.apply_to_delivery} onChange={(e) => setForm({ ...form, apply_to_delivery: e.target.checked })} /> Apply to delivery</label>
        <Input placeholder="Min subtotal (₦)" type="number" value={form.min_subtotal as any} onChange={(e) => setForm({ ...form, min_subtotal: Number(e.target.value) })} />
        <Input placeholder="Max uses" type="number" value={form.max_uses as any} onChange={(e) => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })} />
        <Input placeholder="Expires at (YYYY-MM-DD)" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
        <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={handleCreate} className="bg-olive text-white" disabled={creating}>{creating ? 'Creating...' : 'Create Promo'}</Button>
        <Button variant="ghost" onClick={() => { setForm({ code: '', description: '', discount_type: 'percent', value: 0, apply_to_delivery: false, min_subtotal: 0, max_uses: null, expires_at: '' }); }}>Clear</Button>
      </div>
    </div>
  );
}

// Modal for product CRUD
function ProductModal({ product, isOpen, onClose, onSave }: any) {
  const [form, setForm] = useState(product || {});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(product || {});
  }, [product, isOpen]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Generate a safe filename (handle missing file.name)
      const bucketName = import.meta.env.VITE_UPLOADS_BUCKET || 'uploads';
      const mime = file.type || '';
      let ext = 'jpg';
      if (mime && mime.includes('/')) {
        ext = mime.split('/')[1].split(';')[0] || ext;
      }
      const originalName = (file as any).name || `image-${Date.now()}.${ext}`;
      const safeBase = originalName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
      const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBase}`;
      console.log('[Admin] Uploading image to bucket:', bucketName, 'filename:', filename);
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filename, file, { cacheControl: '3600', upsert: false });

      if (error) {
        console.error('[Admin] Upload error response:', error);
        if (error.message?.includes('bucket') || error.message?.includes('not found')) {
          throw new Error(`Storage bucket "${bucketName}" not found or not accessible. Please check your Supabase project settings or set VITE_UPLOADS_BUCKET correctly.`);
        }
        throw new Error(error.message || 'Upload failed');
      }

      console.log('[Admin] Upload successful, file path:', data?.path);

      // Get public URL (Supabase returns URL without extra transformation for public buckets)
      const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
      const imageUrl = publicData?.publicUrl;

      if (!imageUrl) {
        throw new Error('Failed to generate public URL for uploaded image');
      }

      console.log('[Admin] Public URL generated:', imageUrl);

      // Add to images array (handle both array and single URL)
      const currentImages = Array.isArray(form.images) ? form.images : (form.images ? [form.images] : []);
      setForm({ ...form, images: [...currentImages, imageUrl] });
      toast.success('Image uploaded successfully');
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error(err?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const images = Array.isArray(form.images) ? form.images : [form.images];
    const updated = images.filter((_, i) => i !== index);
    setForm({ ...form, images: updated });
  };

  const handleSave = async () => {
    try {
      if (product?.id) {
        const { error } = await supabase.from('products').update(form).eq('id', product.id);
        if (error) throw error;
        toast.success('Product updated');
      } else {
        const { error } = await supabase.from('products').insert([form]);
        if (error) throw error;
        toast.success('Product created');
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save product');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product?.id ? 'Edit Product' : 'Create Product'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">SKU</label>
            <Input value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Short Description</label>
            <Textarea value={form.short_desc || ''} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} placeholder="Brief description for product listing (stored in DB column `short_desc`)" rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium">Product Benefits (comma-separated or newline)</label>
            <Textarea
              value={typeof form.benefits === 'string' ? form.benefits : Array.isArray(form.benefits) ? form.benefits.join(', ') : ''}
              onChange={(e) => {
                const raw = e.target.value || '';
                // split on comma or newline, trim and remove empty entries
                const parts = raw.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
                setForm({ ...form, benefits: parts });
              }}
              placeholder="Enter benefits separated by commas or new lines"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Price</label>
              <Input type="number" value={form.price || ''} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Original Price</label>
              <Input type="number" value={form.original_price || ''} onChange={(e) => setForm({ ...form, original_price: parseFloat(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Stock</label>
              <Input type="number" value={form.stock || 0} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Product Images</label>
            <div className="space-y-3">
              {/* Image upload button */}
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = ''; // Reset input
                  }}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="cursor-pointer px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors bg-gray-50">
                  {uploading ? 'Uploading...' : '+ Click to upload image'}
                </div>
              </label>

              {/* Display uploaded images */}
              {Array.isArray(form.images) && form.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {form.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt={`Product ${idx}`} className="w-full h-24 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback for single image string */}
              {form.images && typeof form.images === 'string' && form.images.trim() && (
                <div className="relative group">
                  <img src={form.images} alt="Product" className="w-32 h-24 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, images: [] })}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="featured" checked={form.featured || false} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            <label htmlFor="featured" className="text-sm">Featured</label>
          </div>
          <Button onClick={handleSave} className="w-full bg-olive text-white">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Newsletter Manager Component
function NewsletterManager({ subscribers, refetchSubscribers }: any) {
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('custom');

  const templates = {
    welcome: {
      name: 'Welcome Email',
      subject: 'Welcome to TKB GLOW! 🌿',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #556B2F 0%, #6B8E23 100%); padding: 40px 20px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; }
    .content h2 { color: #556B2F; margin-top: 0; }
    .button { display: inline-block; background: #556B2F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to TKB GLOW ✨</h1>
    </div>
    <div class="content">
      <h2>Hello there!</h2>
      <p>Thank you for joining our community! We're thrilled to have you as part of the TKB GLOW family.</p>
      <p>You'll now receive updates about:</p>
      <ul>
        <li>🌿 New product launches</li>
        <li>💝 Exclusive offers and promotions</li>
        <li>✨ Beauty tips and skincare advice</li>
        <li>🎉 Special events and giveaways</li>
      </ul>
      <p>Start shopping and enjoy <strong>15% off</strong> your first order with code <strong>WELCOME15</strong>!</p>
      <a href="#" class="button">Shop Now</a>
    </div>
    <div class="footer">
      <p>&copy; 2025 TKB GLOW. All rights reserved.</p>
      <p>You're receiving this because you subscribed to our newsletter.</p>
    </div>
  </div>
</body>
</html>`
    },
    order_confirmation: {
      name: 'Order Confirmation',
      subject: 'Your Order Confirmed 🎉',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #556B2F 0%, #6B8E23 100%); padding: 40px 20px; text-align: center; color: white; }
    .content { padding: 30px 20px; }
    .order-info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .order-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .order-row.total { font-weight: bold; color: #556B2F; font-size: 16px; border-bottom: none; }
    .button { display: inline-block; background: #556B2F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed! ✓</h1>
    </div>
    <div class="content">
      <h2>Thank you for your order</h2>
      <p>Your order has been received and is being processed.</p>
      <div class="order-info">
        <div class="order-row">
          <span><strong>Order ID:</strong></span>
          <span>#[ORDER_ID]</span>
        </div>
        <div class="order-row">
          <span><strong>Order Date:</strong></span>
          <span>[ORDER_DATE]</span>
        </div>
        <div class="order-row">
          <span><strong>Subtotal:</strong></span>
          <span>₦[SUBTOTAL]</span>
        </div>
        <div class="order-row">
          <span><strong>Delivery:</strong></span>
          <span>₦[DELIVERY]</span>
        </div>
        <div class="order-row total">
          <span><strong>Total:</strong></span>
          <span>₦[TOTAL]</span>
        </div>
      </div>
      <p>We'll send you a shipping notification as soon as your order is on its way!</p>
      <a href="#" class="button">Track Order</a>
    </div>
    <div class="footer">
      <p>&copy; 2025 TKB GLOW. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
    },
    shipped: {
      name: 'Order Shipped',
      subject: 'Your Order is on the Way! 🚚',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #556B2F 0%, #6B8E23 100%); padding: 40px 20px; text-align: center; color: white; }
    .content { padding: 30px 20px; }
    .tracking-info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .button { display: inline-block; background: #556B2F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Order is Shipped! 🎊</h1>
    </div>
    <div class="content">
      <h2>Great news!</h2>
      <p>Your order <strong>#[ORDER_ID]</strong> has shipped and is on its way to you!</p>
      <div class="tracking-info">
        <p><strong>Tracking Number:</strong> [TRACKING_NUMBER]</p>
        <p><strong>Courier:</strong> [COURIER_NAME]</p>
        <p><strong>Estimated Delivery:</strong> [DELIVERY_DATE]</p>
      </div>
      <p>Click below to track your package in real-time:</p>
      <a href="#" class="button">Track Package</a>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">For any questions, reply to this email or contact our support team.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 TKB GLOW. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
    },
    promo: {
      name: 'Promotional Offer',
      subject: 'Exclusive Offer Just for You! 🎁',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #FF6B6B 0%, #FF8787 100%); padding: 40px 20px; text-align: center; color: white; }
    .promo-banner { background: linear-gradient(135deg, #556B2F 0%, #6B8E23 100%); padding: 30px 20px; text-align: center; color: white; font-size: 24px; font-weight: bold; }
    .content { padding: 30px 20px; }
    .button { display: inline-block; background: #556B2F; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-size: 16px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Limited Time Offer! ⏰</h1>
    </div>
    <div class="promo-banner">
      GET 30% OFF TODAY!
    </div>
    <div class="content">
      <h2>Discover Our Latest Collection</h2>
      <p>We're offering you an exclusive <strong>30% discount</strong> on selected beauty products!</p>
      <p>Don't miss out on premium skincare essentials at unbeatable prices.</p>
      <ul>
        <li>✨ Premium quality products</li>
        <li>💝 Fast & secure delivery</li>
        <li>🔄 Easy returns</li>
        <li>⭐ Customer satisfaction guaranteed</li>
      </ul>
      <p><strong>Use code: BEAUTY30</strong> at checkout (Valid until [EXPIRY_DATE])</p>
      <a href="#" class="button">Shop Now</a>
    </div>
    <div class="footer">
      <p>&copy; 2025 TKB GLOW. All rights reserved.</p>
      <p>This offer is exclusively for you!</p>
    </div>
  </div>
</body>
</html>`
    },
    abandoned_cart: {
      name: 'Abandoned Cart',
      subject: 'You Left Something Behind! 💔',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #FFA500 0%, #FFB347 100%); padding: 40px 20px; text-align: center; color: white; }
    .content { padding: 30px 20px; }
    .cart-item { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0; display: flex; justify-content: space-between; }
    .button { display: inline-block; background: #556B2F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Cart is Waiting! 🛍️</h1>
    </div>
    <div class="content">
      <h2>Hi there!</h2>
      <p>We noticed you left some amazing products in your cart. Here's a reminder of what you found:</p>
      <div class="cart-item">
        <span>[PRODUCT_NAME]</span>
        <span>₦[PRODUCT_PRICE]</span>
      </div>
      <p style="margin-top: 20px;">Complete your purchase now and don't miss out on these beautiful products!</p>
      <p><strong>Special offer:</strong> Use code COMEBACK10 for 10% off</p>
      <a href="#" class="button">Complete Purchase</a>
    </div>
    <div class="footer">
      <p>&copy; 2025 TKB GLOW. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
    },
    review_request: {
      name: 'Review Request',
      subject: 'We\'d Love Your Feedback! ⭐',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 40px 20px; text-align: center; color: white; }
    .content { padding: 30px 20px; }
    .button { display: inline-block; background: #556B2F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>How Was Your Experience? ⭐</h1>
    </div>
    <div class="content">
      <h2>Your feedback matters!</h2>
      <p>Thank you for shopping with TKB GLOW! We\'d love to hear about your experience with your recent purchase <strong>#[ORDER_ID]</strong>.</p>
      <p>Your honest reviews help us serve you better and guide other customers in finding the perfect products.</p>
      <p>Share your thoughts and receive <strong>a special discount</strong> on your next order!</p>
      <a href="#" class="button">Leave a Review</a>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">Questions? We're here to help. Reply to this email anytime.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 TKB GLOW. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
    }
  };

  const handleTemplateSelect = (templateKey: string) => {
    if (templateKey === 'custom') {
      setSubject('');
      setHtmlContent('');
    } else {
      const template = (templates as any)[templateKey];
      if (template) {
        setSubject(template.subject);
        setHtmlContent(template.html);
      }
    }
    setSelectedTemplate(templateKey);
  };

  const handleSend = async () => {
    if (!subject || !htmlContent) {
      return toast.error('Subject and content required');
    }
    setSending(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const resp = await fetch(`${serverUrl}/api/newsletter/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || ''
        },
        body: JSON.stringify({ subject, html: htmlContent })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Send failed');
      }
      toast.success('Newsletter sent to ' + (subscribers?.length || 0) + ' subscribers');
      setSubject('');
      setHtmlContent('');
      setSelectedTemplate('custom');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send newsletter');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Newsletter</h3>
          <p className="text-sm text-muted-foreground">Manage subscribers and send newsletters with templates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="text-sm font-medium">Select Template</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => handleTemplateSelect('custom')}
                className={`p-2 rounded border text-sm ${selectedTemplate === 'custom' ? 'bg-olive text-white border-olive' : 'border-gray-200 hover:border-gray-300'}`}
              >
                Custom
              </button>
              {Object.entries(templates).map(([key, value]: any) => (
                <button
                  key={key}
                  onClick={() => handleTemplateSelect(key)}
                  className={`p-2 rounded border text-sm ${selectedTemplate === key ? 'bg-olive text-white border-olive' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {value.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Subject</label>
            <Input placeholder="Email subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">HTML Content</label>
            <Textarea placeholder="HTML email content" value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} rows={10} className="font-mono text-xs" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSend} className="bg-olive text-white" disabled={sending}>{sending ? 'Sending...' : 'Send Newsletter'}</Button>
            <Button onClick={() => setShowPreview(!showPreview)} variant="outline">Preview</Button>
            <Button onClick={() => { setSubject(''); setHtmlContent(''); setSelectedTemplate('custom'); }} variant="ghost">Clear</Button>
          </div>

          {showPreview && (
            <div className="border rounded p-4 bg-white">
              <h4 className="font-semibold mb-2">Preview</h4>
              <div className="border rounded bg-white p-4 max-h-96 overflow-y-auto" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Subscribers ({subscribers?.length || 0})</h4>
          <div className="max-h-80 overflow-y-auto border rounded p-2 bg-white">
            {subscribers && subscribers.length > 0 ? (
              subscribers.map((s: any) => (
                <div key={s.id} className="text-sm py-1 border-b last:border-0">{s.email}</div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No subscribers yet.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { refetchSubscribers(); toast.success('Refreshed'); }} className="w-full">Refresh</Button>
            <Button onClick={async () => {
              if (!confirm('Delete all subscribers? This cannot be undone.')) return;
              try {
                const { error } = await supabase.from('newsletter_subscribers').delete().neq('id', '');
                if (error) throw error;
                refetchSubscribers();
                toast.success('Deleted all subscribers');
              } catch (err) {
                console.error(err);
                toast.error('Failed to delete');
              }
            }} variant="destructive" className="w-full">Delete All</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Modal for order details
function OrderDetailsModal({ order, isOpen, onClose, onStatusChange }: any) {
  const [newStatus, setNewStatus] = useState(order?.status || 'pending');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderVehicle, setRiderVehicle] = useState('');
  const [trackingStatus, setTrackingStatus] = useState('out_for_delivery');
  const [trackingMessage, setTrackingMessage] = useState('');
  const [sendingTracking, setSendingTracking] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ items: true, shipping: true, actions: true });

  useEffect(() => {
    setNewStatus(order?.status || 'pending');
  }, [order, isOpen]);

  const handleStatusUpdate = async () => {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const response = await fetch(`${serverUrl}/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }

      toast.success('Order status updated');
      onStatusChange();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update order');
    }
  };

  const handleSendNotification = async (type: 'delivery_started' | 'refund' | 'custom') => {
    setSendingNotification(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      
      let message = notificationMessage;
      if (type === 'delivery_started') {
        message = `Your order #${order.id.slice(0, 8)} is on the way! Your delivery driver will arrive soon.`;
      } else if (type === 'refund') {
        message = `Your refund for order #${order.id.slice(0, 8)} has been processed. The amount will appear in your account within 3-5 business days.`;
      }

      const response = await fetch(`${serverUrl}/api/orders/${order.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type,
          message,
          channel: 'whatsapp'
        })
      });

      if (!response.ok) throw new Error('Failed to send notification');

      const json = await response.json().catch(() => ({}));

      // If server returned a wa.me link for admin click-to-chat, open it
      if (json && json.wa_link) {
        const newWindow = window.open(json.wa_link, '_blank');
        if (newWindow === null || typeof newWindow === 'undefined') {
          // window.open was blocked by browser
          toast.error('Open blocked: Click link to copy WhatsApp URL');
          console.log('[Admin] WhatsApp link (blocked by browser):', json.wa_link);
          // Show a dialog with clickable link
          const userChoice = confirm(`Pop-up blocked. Click OK to open in browser, or cancel to copy link.\n\nLink: ${json.wa_link}`);
          if (userChoice) {
            // Try again with more user-friendly approach
            const link = document.createElement('a');
            link.href = json.wa_link;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            // Copy to clipboard
            navigator.clipboard.writeText(json.wa_link).then(() => {
              toast.success('WhatsApp link copied to clipboard');
            }).catch(() => {
              toast.info(`WhatsApp link: ${json.wa_link}`);
            });
          }
        } else {
          toast.success('Opened WhatsApp link for admin');
        }
      } else {
        toast.success(`${type === 'delivery_started' ? 'Delivery started' : type === 'refund' ? 'Refund' : 'Custom'} notification sent via WhatsApp`);
      }

      setNotificationMessage('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const response = await fetch(`${serverUrl}/api/orders/${order.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType: 'delivery_details',
          riderInfo: riderName || riderPhone ? {
            name: riderName,
            phone: riderPhone,
            vehicle: riderVehicle
          } : undefined
        })
      });

      if (!response.ok) throw new Error('Failed to send email');
      
      toast.success('Delivery details email sent');
      setRiderName('');
      setRiderPhone('');
      setRiderVehicle('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendConfirmation = async () => {
    setSendingConfirmation(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const response = await fetch(`${serverUrl}/api/orders/${order.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailType: 'order_confirmation' })
      });

      if (!response.ok) throw new Error('Failed to send confirmation email');

      toast.success('Order confirmation email sent');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send confirmation email');
    } finally {
      setSendingConfirmation(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const resp = await fetch(`${serverUrl}/api/admin/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' }
      });
      if (!resp.ok) throw new Error(await resp.text());
      toast.success('Order cancelled');
      onStatusChange();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel order');
    }
  };

  const handleRefundOrder = async () => {
    if (!confirm('Refund this order? This will mark the order as refunded.')) return;
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const resp = await fetch(`${serverUrl}/api/admin/orders/${order.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' }
      });
      if (!resp.ok) throw new Error(await resp.text());
      toast.success('Order marked refunded');
      onStatusChange();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to refund order');
    }
  };

  const handleReinitPaystack = async () => {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const resp = await fetch(`${serverUrl}/api/admin/orders/${order.id}/paystack-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' }
      });
      if (!resp.ok) throw new Error(await resp.text());
      const json = await resp.json();
      if (json.paystack && json.paystack.authorization_url) {
        window.open(json.paystack.authorization_url, '_blank');
        toast.success('Opened Paystack payment page');
      } else {
        toast.success('Paystack initialized (check server response)');
        console.warn('paystack init response', json);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to initialize Paystack');
    }
  };

  const handleMarkPaidAdmin = async () => {
    if (!confirm('Mark this order as paid and decrement stock?')) return;
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const resp = await fetch(`${serverUrl}/api/orders/${order.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' },
        body: JSON.stringify({ provider: order.payment_provider || 'manual', provider_ref: `admin-${Date.now()}` })
      });
      if (!resp.ok) throw new Error(await resp.text());
      toast.success('Order marked paid');
      onStatusChange();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark paid');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSendTracking = async () => {
    if (!trackingMessage.trim()) {
      toast.error('Please enter a tracking message');
      return;
    }
    setSendingTracking(true);
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const response = await fetch(`${serverUrl}/api/orders/${order.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: trackingStatus,
          message: trackingMessage
        })
      });

      if (!response.ok) throw new Error('Failed to send tracking update');
      
      toast.success('Tracking update sent to customer via email & WhatsApp');
      setTrackingMessage('');
      setTrackingStatus('out_for_delivery');
      onStatusChange();
    } catch (err) {
      console.error(err);
      toast.error('Failed to send tracking update');
    } finally {
      setSendingTracking(false);
    }
  };

  if (!order) return null;

  const shippingAddress = typeof order.shipping_address === 'string' 
    ? JSON.parse(order.shipping_address) 
    : order.shipping_address;
  const subtotal = order.total - (order.delivery_charge || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Order Details - {order.id?.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          
          {/* Customer Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-blue-900">Customer Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Name</p>
                <p className="font-medium">{order.profiles?.full_name || 'Guest'}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{order.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Order Date</p>
                <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <Badge className="capitalize" variant={order.status === 'pending' ? 'destructive' : 'default'}>
                  {order.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <button 
              onClick={() => toggleSection('items')}
              className="w-full flex justify-between items-center font-semibold mb-3 p-2 bg-gray-50 rounded hover:bg-gray-100"
            >
              <span>Order Items ({order.order_items?.length || 0})</span>
              <span>{expandedSections.items ? '▼' : '▶'}</span>
            </button>
            {expandedSections.items && (
              <div className="space-y-2 bg-gray-50 p-3 rounded border">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm pb-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.product_title}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">₦{(item.product_price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">₦{subtotal.toLocaleString()}</span>
            </div>
            {order.delivery_charge > 0 && (
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-medium">₦{parseFloat(order.delivery_charge).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-300 text-base font-semibold">
              <span>Total</span>
              <span className="text-gold">₦{parseFloat(order.total).toLocaleString()}</span>
            </div>
          </div>

          {/* Shipping Address */}
          {shippingAddress && (
            <div>
              <button 
                onClick={() => toggleSection('shipping')}
                className="w-full flex justify-between items-center font-semibold mb-3 p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                <span>Shipping Address</span>
                <span>{expandedSections.shipping ? '▼' : '▶'}</span>
              </button>
              {expandedSections.shipping && (
                <div className="bg-gray-50 p-4 rounded border space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600">Address</p>
                    <p className="font-medium">{shippingAddress.confirmed_address || shippingAddress.raw_address || 'N/A'}</p>
                  </div>
                  {shippingAddress.phone && (
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium">{shippingAddress.phone}</p>
                    </div>
                  )}
                  {shippingAddress.city && (
                    <div>
                      <p className="text-gray-600">City / State</p>
                      <p className="font-medium">{shippingAddress.city}, {shippingAddress.state}</p>
                    </div>
                  )}
                  {shippingAddress.notes && (
                    <div className="bg-blue-50 p-2 rounded border border-blue-200">
                      <p className="text-xs text-blue-800"><strong>Delivery Notes:</strong> {shippingAddress.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status Update */}
          <div className="border rounded-lg p-4">
            <label className="text-sm font-medium block mb-2">Update Order Status</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleStatusUpdate} className="w-full mt-3 bg-olive text-white">
              Update Status
            </Button>
          </div>

          {/* Actions Section */}
          <div>
            <button 
              onClick={() => toggleSection('actions')}
              className="w-full flex justify-between items-center font-semibold mb-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded hover:from-green-100 hover:to-emerald-100 border border-green-200"
            >
              <span>Customer Actions</span>
              <span>{expandedSections.actions ? '▼' : '▶'}</span>
            </button>
            {expandedSections.actions && (
              <div className="space-y-4 bg-green-50 p-4 rounded border border-green-200">
                
                {/* Send Email */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-bold mb-3 text-blue-900">📧 Send Delivery Email</p>
                  
                  {/* Rider Info Inputs */}
                  <div className="space-y-3 mb-4 bg-white p-3 rounded border border-blue-100">
                    <p className="text-xs font-semibold text-blue-800 mb-2">Dispatch Rider Information (Optional)</p>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Rider Name</label>
                      <Input 
                        value={riderName}
                        onChange={(e) => setRiderName(e.target.value)}
                        placeholder="e.g., Chioma Johnson"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Rider Phone</label>
                      <Input 
                        value={riderPhone}
                        onChange={(e) => setRiderPhone(e.target.value)}
                        placeholder="e.g., +234 803 456 7890"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Vehicle/Transport</label>
                      <Input 
                        value={riderVehicle}
                        onChange={(e) => setRiderVehicle(e.target.value)}
                        placeholder="e.g., Yellow Bike / Toyota Van"
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2"
                  >
                    {sendingEmail ? '⏳ Sending...' : '📧 Send Delivery Details Email'}
                  </Button>
                  <div className="mt-3">
                    <Button
                      onClick={handleSendConfirmation}
                      disabled={sendingConfirmation}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2"
                    >
                      {sendingConfirmation ? '⏳ Sending...' : '📩 Send Order Confirmation Email'}
                    </Button>
                    <p className="text-xs text-gray-600 mt-2">Sends order confirmation (order id, total) to customer</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Sends order summary + delivery address + rider info (if provided) to customer</p>
                </div>

                {/* Quick Notifications */}
                <div>
                  <p className="text-sm font-medium mb-3">Send WhatsApp Notification</p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleSendNotification('delivery_started')}
                      disabled={sendingNotification}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      {sendingNotification ? 'Sending...' : '🚚 Delivery Started'}
                    </Button>
                    
                    <Button 
                      onClick={() => handleSendNotification('refund')}
                      disabled={sendingNotification}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm"
                    >
                      {sendingNotification ? 'Sending...' : '💰 Refund Processed'}
                    </Button>
                  </div>
                </div>

                {/* Custom Message */}
                <div>
                  <label className="text-sm font-medium block mb-2">Send Custom WhatsApp Message</label>
                  <textarea 
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Type a custom message to send via WhatsApp..."
                    className="w-full border border-gray-300 rounded p-2 text-sm resize-none focus:outline-none focus:border-green-500"
                    rows={2}
                  />
                  <Button 
                    onClick={() => handleSendNotification('custom')}
                    disabled={sendingNotification || !notificationMessage.trim()}
                    className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white text-sm"
                  >
                    {sendingNotification ? 'Sending...' : 'Send Custom Message'}
                  </Button>
                </div>

                {/* Delivery Tracking */}
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <p className="text-sm font-bold mb-3 text-teal-900">📍 Send Delivery Tracking Update</p>
                  <div className="space-y-3 bg-white p-3 rounded border border-teal-100">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Tracking Status</label>
                      <Select value={trackingStatus} onValueChange={setTrackingStatus}>
                        <SelectTrigger className="mt-1 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                          <SelectItem value="arriving_soon">Arriving Soon</SelectItem>
                          <SelectItem value="arrived">Arrived</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Tracking Message</label>
                      <textarea 
                        value={trackingMessage}
                        onChange={(e) => setTrackingMessage(e.target.value)}
                        placeholder="e.g., Driver is 5 minutes away"
                        className="w-full border border-gray-300 rounded p-2 text-sm resize-none focus:outline-none focus:border-teal-500 mt-1"
                        rows={2}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSendTracking}
                    disabled={sendingTracking || !trackingMessage.trim()}
                    className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2"
                  >
                    {sendingTracking ? '⏳ Sending...' : '📍 Send Tracking Update'}
                  </Button>
                  <p className="text-xs text-gray-600 mt-2">Sends tracking update to customer via email + WhatsApp</p>
                </div>

                {/* Admin Order Actions */}
                <div>
                  <p className="text-sm font-medium mb-2">Admin Actions</p>
                  <div className="space-y-2">
                    <Button onClick={handleMarkPaidAdmin} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm">Mark Paid</Button>
                    <Button onClick={handleReinitPaystack} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">Re-init Paystack</Button>
                    <Button onClick={handleRefundOrder} className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm">Refund Order</Button>
                    <Button onClick={handleCancelOrder} className="w-full bg-red-600 hover:bg-red-700 text-white text-sm">Cancel Order</Button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

// Modal for driver CRUD
function DriverModal({ driver, isOpen, onClose, onSave }: any) {
  const [form, setForm] = useState(driver || {});

  useEffect(() => {
    setForm(driver || {});
  }, [driver, isOpen]);

  const handleSave = async () => {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      if (driver?.id) {
        const resp = await fetch(`${serverUrl}/api/admin/drivers/${driver.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' },
          body: JSON.stringify(form)
        });
        if (!resp.ok) throw new Error('Failed to update driver');
        toast.success('Driver updated');
      } else {
        const resp = await fetch(`${serverUrl}/api/admin/drivers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' },
          body: JSON.stringify(form)
        });
        if (!resp.ok) throw new Error('Failed to create driver');
        toast.success('Driver created');
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save driver');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{driver?.id ? 'Edit Driver' : 'Create Driver'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">WhatsApp</label>
            <Input value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Vehicle</label>
            <Input value={form.vehicle || ''} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <label htmlFor="active" className="text-sm">Active</label>
          </div>
          <Button onClick={handleSave} className="w-full bg-olive text-white">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Modal for delivery charge CRUD
function DeliveryChargeModal({ charge, isOpen, onClose, onSave }: any) {
  const [form, setForm] = useState(charge || {});

  useEffect(() => {
    setForm(charge || {});
  }, [charge, isOpen]);

  const handleSave = async () => {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      if (charge?.id) {
        const resp = await fetch(`${serverUrl}/api/admin/delivery-charges/${charge.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' },
          body: JSON.stringify(form)
        });
        if (!resp.ok) throw new Error('Failed to update charge');
        toast.success('Delivery charge updated');
      } else {
        const resp = await fetch(`${serverUrl}/api/admin/delivery-charges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' },
          body: JSON.stringify(form)
        });
        if (!resp.ok) throw new Error('Failed to create charge');
        toast.success('Delivery charge created');
      }
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save delivery charge');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{charge?.id ? 'Edit Delivery Charge' : 'Create Delivery Charge'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">State</label>
            <Input value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">City (optional, leave blank for state-wide)</label>
            <Input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Charge (₦)</label>
            <Input type="number" step="0.01" value={form.charge || ''} onChange={(e) => setForm({ ...form, charge: parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm font-medium">Min Subtotal (₦) - optional</label>
            <Input type="number" step="0.01" value={form.min_subtotal || ''} onChange={(e) => setForm({ ...form, min_subtotal: parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button onClick={handleSave} className="w-full bg-olive text-white">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 🔐 Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/auth');
  }, [user, isAdmin, loading, navigate]);

  // 📊 Fetch dashboard stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [products, orders, users] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total, status'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      const totalRevenue = orders.data?.reduce(
        (sum, order) => sum + parseFloat(order.total.toString()),
        0
      ) || 0;

      const pendingOrders = orders.data?.filter((o: any) => o.status === 'pending').length || 0;

      return {
        totalProducts: products.count || 0,
        totalOrders: orders.data?.length || 0,
        totalRevenue,
        totalUsers: users.count || 0,
        pendingOrders
      };
    },
    enabled: isAdmin
  });

  // 📦 Fetch all products
  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });

  // 🧾 Fetch orders with items
  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const resp = await fetch(`${serverUrl}/api/admin/orders`, { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } });
      if (!resp.ok) throw new Error('Failed to fetch orders');
      return resp.json();
    },
    enabled: isAdmin
  });

  // 🚚 Fetch delivery drivers
  const { data: drivers, refetch: refetchDrivers } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const resp = await fetch(`${serverUrl}/api/admin/drivers`, { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } });
      if (!resp.ok) throw new Error('Failed to fetch drivers');
      return resp.json();
    },
    enabled: isAdmin
  });

  // 💰 Fetch delivery charges
  const { data: charges, refetch: refetchCharges } = useQuery({
    queryKey: ['admin-delivery-charges'],
    queryFn: async () => {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const resp = await fetch(`${serverUrl}/api/admin/delivery-charges`, { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } });
      if (!resp.ok) throw new Error('Failed to fetch charges');
      return resp.json();
    },
    enabled: isAdmin
  });

  // 👥 Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });

  // 📨 Fetch newsletter subscribers
  const { data: subscribers, refetch: refetchSubscribers } = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });

  // ➕ Fetch promos (admin-only)
  const { data: promos, refetch: refetchPromos } = useQuery({
    queryKey: ['admin-promos'],
    queryFn: async () => {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const resp = await fetch(`${serverUrl}/api/promos`, { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } });
      if (!resp.ok) throw new Error('Failed to fetch promos');
      const j = await resp.json();
      return j.promos || [];
    },
    enabled: isAdmin
  });

  // 📈 Fetch chart data
  const { data: chartData } = useQuery({
    queryKey: ['admin-charts'],
    queryFn: async () => {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total, created_at')
        .order('created_at', { ascending: true });

      const revenueByDay = ordersData?.reduce((acc: any, order: any) => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = acc.find((d: any) => d.date === date);
        if (existing) {
          existing.revenue += parseFloat(order.total.toString());
        } else {
          acc.push({ date, revenue: parseFloat(order.total.toString()) });
        }
        return acc;
      }, []) || [];

      const { data: statusData } = await supabase.from('orders').select('status');

      const statusDist = [
        { name: 'Pending', value: statusData?.filter((o: any) => o.status === 'pending').length || 0 },
        { name: 'Processing', value: statusData?.filter((o: any) => o.status === 'processing').length || 0 },
        { name: 'Shipped', value: statusData?.filter((o: any) => o.status === 'shipped').length || 0 },
        { name: 'Delivered', value: statusData?.filter((o: any) => o.status === 'delivered').length || 0 }
      ];

      return { revenueByDay: revenueByDay.slice(-7), statusDist };
    },
    enabled: isAdmin
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const filteredProducts = products?.filter((p: any) => p.title.toLowerCase().includes(productSearch.toLowerCase())) || [];
  const filteredOrders = orders?.filter((o: any) => {
    const matchesSearch = o.email.toLowerCase().includes(orderSearch.toLowerCase()) || o.profiles?.full_name?.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const COLORS = ['#556B2F', '#D4AF37', '#FF6B6B', '#4ECDC4'];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <Button variant="ghost" onClick={() => navigate('/')}>Back to store</Button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-olive/10 rounded-lg"><TrendingUp className="w-6 h-6 text-olive" /></div>
              <div><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold text-gold">₦{stats?.totalRevenue.toLocaleString()}</p></div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-olive/10 rounded-lg"><ShoppingCart className="w-6 h-6 text-olive" /></div>
              <div><p className="text-sm text-muted-foreground">Orders</p><p className="text-2xl font-bold">{stats?.totalOrders}</p></div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
              <div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-red-600">{stats?.pendingOrders}</p></div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-olive/10 rounded-lg"><Package className="w-6 h-6 text-olive" /></div>
              <div><p className="text-sm text-muted-foreground">Products</p><p className="text-2xl font-bold">{stats?.totalProducts}</p></div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-olive/10 rounded-lg"><Users className="w-6 h-6 text-olive" /></div>
              <div><p className="text-sm text-muted-foreground">Customers</p><p className="text-2xl font-bold">{stats?.totalUsers}</p></div>
            </div>
          </Card>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData?.revenueByDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Order Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData?.statusDist || []} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {chartData?.statusDist?.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* TABS */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
            <TabsTrigger value="promos">Promos</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {/* PRODUCTS */}
          <TabsContent value="products">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6 gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-10" />
                </div>
                <Button onClick={() => { setSelectedProduct(null); setProductModalOpen(true); }} className="bg-olive text-white flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>

              <div className="space-y-4">
                {filteredProducts?.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition">
                    <div className="flex items-center gap-4 flex-1">
                      {product.images?.[0] && <img src={product.images[0]} className="w-14 h-14 object-cover rounded" />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{product.title}</p>
                          {product.featured && <Badge className="bg-gold text-black">Featured</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">SKU: {product.sku} • Stock: {product.stock}</p>
                        {product.stock < 5 && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><AlertTriangle className="w-3 h-3" /> Low stock</p>}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="font-bold text-gold">₦{parseFloat(product.price).toLocaleString()}</p>
                        {product.original_price && <p className="text-xs text-muted-foreground line-through">₦{parseFloat(product.original_price).toLocaleString()}</p>}
                      </div>
                      <button onClick={() => { setSelectedProduct(product); setProductModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={async () => { if (confirm('Delete?')) { try { const { error } = await supabase.from('products').delete().eq('id', product.id); if (error) throw error; refetchProducts(); toast.success('Deleted'); } catch (err) { toast.error('Failed'); } } }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {filteredProducts?.length === 0 && <p className="text-center text-muted-foreground py-8">No products found</p>}
              </div>
            </Card>
          </TabsContent>

          {/* NEWSLETTER */}
          <TabsContent value="newsletter">
            <NewsletterManager subscribers={subscribers} refetchSubscribers={refetchSubscribers} />
          </TabsContent>

          {/* ORDERS */}
          <TabsContent value="orders">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6 gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="Search by email or name..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredOrders?.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{order.profiles?.full_name || 'Guest'}</p>
                          <p className="text-sm text-muted-foreground">{order.email}</p>
                        </div>
                        <Badge variant={order.status === 'pending' ? 'destructive' : 'default'} className="capitalize">{order.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{order.order_items?.length} item(s) • {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className="font-bold text-gold">₦{parseFloat(order.total).toLocaleString()}</p>
                      <button onClick={() => { setSelectedOrder(order); setOrderModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
                {filteredOrders?.length === 0 && <p className="text-center text-muted-foreground py-8">No orders found</p>}
              </div>
            </Card>
          </TabsContent>

          {/* DELIVERY */}
          <TabsContent value="delivery" className="space-y-6">
            {/* DRIVERS */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Truck className="w-5 h-5" /> Delivery Drivers</h3>
                <Button onClick={() => { setSelectedDriver(null); setDriverModalOpen(true); }} className="bg-olive text-white flex items-center gap-2"><Plus className="w-4 h-4" /> Add</Button>
              </div>
              <div className="space-y-4">
                {drivers?.map((driver: any) => (
                  <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{driver.full_name}</p>
                          <p className="text-sm text-muted-foreground">{driver.phone} • {driver.vehicle}</p>
                          <p className="text-xs text-muted-foreground">WhatsApp: {driver.whatsapp}</p>
                        </div>
                        <Badge variant={driver.active ? 'default' : 'secondary'}>{driver.active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedDriver(driver); setDriverModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={async () => { if (confirm('Delete?')) { try { const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'; const resp = await fetch(`${serverUrl}/api/admin/drivers/${driver.id}`, { method: 'DELETE', headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } }); if (!resp.ok) throw new Error('Failed'); refetchDrivers(); toast.success('Deleted'); } catch (err) { toast.error('Failed'); } } }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {(!drivers || drivers.length === 0) && <p className="text-center text-muted-foreground py-8">No drivers yet.</p>}
              </div>
            </Card>

            {/* CHARGES */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Delivery Charges</h3>
                <Button onClick={() => { setSelectedCharge(null); setChargeModalOpen(true); }} className="bg-olive text-white flex items-center gap-2"><Plus className="w-4 h-4" /> Add</Button>
              </div>
              <div className="space-y-4">
                {charges?.map((charge: any) => (
                  <div key={charge.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition">
                    <div className="flex-1">
                      <p className="font-medium">{charge.state} {charge.city ? `• ${charge.city}` : '(statewide)'}</p>
                      <p className="text-sm text-muted-foreground">{charge.notes && `${charge.notes} • `}Min: ₦{parseFloat(charge.min_subtotal || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className="font-bold text-gold text-lg">₦{parseFloat(charge.charge).toLocaleString()}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedCharge(charge); setChargeModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={async () => { if (confirm('Delete?')) { try { const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'; const resp = await fetch(`${serverUrl}/api/admin/delivery-charges/${charge.id}`, { method: 'DELETE', headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } }); if (!resp.ok) throw new Error('Failed'); refetchCharges(); toast.success('Deleted'); } catch (err) { toast.error('Failed'); } } }} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {(!charges || charges.length === 0) && <p className="text-center text-muted-foreground py-8">No charges configured.</p>}
              </div>
            </Card>
          </TabsContent>

          {/* CUSTOMERS */}
          <TabsContent value="customers">
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Customers</h3>
              </div>

              <div className="space-y-4">
                {customers && customers.length > 0 ? (
                  customers.map((customer: any) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{customer.full_name || 'Guest'}</p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                            {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate(`/admin/customer/${customer.id}`)}
                        className="bg-olive text-white flex items-center gap-2"
                      >
                        <ChevronRight className="w-4 h-4" /> View Details
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No customers yet.</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* PROMOS */}
          <TabsContent value="promos">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Promo Codes</h3>
                  <p className="text-sm text-muted-foreground">Create and manage promo codes (admin only)</p>
                </div>
                <Button onClick={() => refetchPromos()} className="bg-olive text-white">Refresh</Button>
              </div>

              <div className="mb-4">
                <PromoManager promos={promos || []} onChange={() => refetchPromos()} />
              </div>

              <div className="space-y-2">
                {(promos || []).map((p: any) => (
                  <div key={p.id} className="p-3 bg-white rounded border flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.code} {p.active ? <Badge className="ml-2">Active</Badge> : <Badge className="ml-2">Inactive</Badge>}</div>
                      <div className="text-sm text-muted-foreground">{p.description || ''} • Uses: {p.uses || 0}{p.max_uses ? ` / ${p.max_uses}` : ''}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={async () => {
                        if (!confirm('Delete promo?')) return;
                        try {
                          const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
                          const resp = await fetch(`${serverUrl}/api/promos/${encodeURIComponent(p.code)}`, { method: 'DELETE', headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' } });
                          if (!resp.ok) throw new Error(await resp.text());
                          toast.success('Deleted');
                          refetchPromos();
                        } catch (err) {
                          console.error(err);
                          toast.error('Failed to delete promo');
                        }
                      }} variant="destructive">Delete</Button>

                      <Button onClick={async () => {
                        try {
                          const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
                          const resp = await fetch(`${serverUrl}/api/promos/${encodeURIComponent(p.code)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET || '' }, body: JSON.stringify({ active: !p.active }) });
                          if (!resp.ok) throw new Error(await resp.text());
                          toast.success('Updated');
                          refetchPromos();
                        } catch (err) {
                          console.error(err);
                          toast.error('Failed to update');
                        }
                      }}>Toggle</Button>
                    </div>
                  </div>
                ))}
                {(promos || []).length === 0 && <div className="p-4 bg-white rounded border text-sm text-muted-foreground">No promos yet</div>}
              </div>
            </Card>
          </TabsContent>

          {/* REVENUE ANALYTICS */}
          <TabsContent value="revenue">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Revenue Analytics</h3>
                  <p className="text-sm text-muted-foreground">View detailed revenue breakdown and analytics</p>
                </div>
                <Button
                  onClick={() => navigate('/admin/revenue')}
                  className="bg-olive text-white flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" /> Open Analytics
                </Button>
              </div>

              {/* Quick Summary */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-gradient-to-br from-olive/10 to-gold/10 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gold">₦{stats?.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-olive/10 to-gold/10 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-2xl font-bold">{stats?.totalOrders}</p>
                </div>
                <div className="bg-gradient-to-br from-olive/10 to-gold/10 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Average Order Value</p>
                  <p className="text-2xl font-bold">₦{stats?.totalOrders ? (stats.totalRevenue / stats.totalOrders).toLocaleString() : '0'}</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* MODALS */}
      <ProductModal product={selectedProduct} isOpen={productModalOpen} onClose={() => setProductModalOpen(false)} onSave={() => { refetchProducts(); refetchStats(); }} />
      <OrderDetailsModal order={selectedOrder} isOpen={orderModalOpen} onClose={() => setOrderModalOpen(false)} onStatusChange={() => { refetchOrders(); refetchStats(); }} />
      <DriverModal driver={selectedDriver} isOpen={driverModalOpen} onClose={() => setDriverModalOpen(false)} onSave={() => refetchDrivers()} />
      <DeliveryChargeModal charge={selectedCharge} isOpen={chargeModalOpen} onClose={() => setChargeModalOpen(false)} onSave={() => refetchCharges()} />
    </div>
  );
}
