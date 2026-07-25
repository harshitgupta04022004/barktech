import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, CheckCircle, Package, LogIn } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';

interface Product {
  _id: string;
  name: string;
  slug: string;
  categoryId?: { name: string; slug: string };
}

function getLoggedInUser(): { firstName: string; lastName: string; email: string } | null {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const userStr = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!token || !userStr) return null;
    const user = JSON.parse(userStr);
    const fullName = user.fullName || user.name || '';
    const parts = fullName.trim().split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      email: user.email || '',
    };
  } catch {
    return null;
  }
}

const loggedInUser = getLoggedInUser();

const inquirySchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  company: z.string().min(2, 'Company name is required'),
  country: z.string().min(2, 'Country is required'),
  productId: z.string().min(1, 'Please select a product'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  message: z.string().min(10, 'Please provide more details (min 10 characters)'),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

export function InquiryForm() {
  const [searchParams] = useSearchParams();
  const preselectedProductId = searchParams.get('productId') || '';
  const preselectedProductName = searchParams.get('productName') || '';
  const [submitted, setSubmitted] = useState(false);
  const isLoggedIn = !!loggedInUser;

  const { data: productsData } = useQuery<{ success: boolean; data: Product[] }>({
    queryKey: ['products-for-inquiry'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=200');
      return res.json();
    },
  });

  const products = productsData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      quantity: 1,
      firstName: loggedInUser?.firstName || '',
      lastName: loggedInUser?.lastName || '',
      email: loggedInUser?.email || '',
      productId: preselectedProductId,
    },
  });

  const onSubmit = async (data: InquiryFormData) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          company: data.company,
          country: data.country,
          productId: data.productId,
          quantity: data.quantity,
          message: data.message,
          type: 'rfq',
          source: 'website_inquiry_form',
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        reset();
      }
    } catch {
      // Error handled silently
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Thank You!</h1>
        <p className="mt-4 text-muted-foreground">
          Your inquiry has been submitted successfully. Our team will get back to you within 24 hours.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => setSubmitted(false)} variant="outline">
            Submit Another Inquiry
          </Button>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Request for Quotation</h1>
        <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
          Fill in the details below and our sales team will prepare a customized quote for you.
        </p>
        {isLoggedIn && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Logged in as {loggedInUser?.firstName} — your details are pre-filled
          </div>
        )}
        {!isLoggedIn && (
          <div className="mt-3 text-sm text-muted-foreground">
            <Link to="/admin/login" className="inline-flex items-center gap-1 text-primary hover:underline">
              <LogIn className="h-3.5 w-3.5" />
              Login first
            </Link>
            {' '}to auto-fill your saved details, or fill in manually below.
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Contact Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">First Name *</label>
                  <Input {...register('firstName')} placeholder="John" className={cn(errors.firstName && 'border-red-500')} />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Last Name *</label>
                  <Input {...register('lastName')} placeholder="Doe" className={cn(errors.lastName && 'border-red-500')} />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
                  <Input {...register('email')} type="email" placeholder="john@company.com" className={cn(errors.email && 'border-red-500')} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Phone *</label>
                  <Input {...register('phone')} placeholder="+91 98765 43210" className={cn(errors.phone && 'border-red-500')} />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Company Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Company Name *</label>
                  <Input {...register('company')} placeholder="Acme Industries" className={cn(errors.company && 'border-red-500')} />
                  {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Country *</label>
                  <Input {...register('country')} placeholder="India" className={cn(errors.country && 'border-red-500')} />
                  {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country.message}</p>}
                </div>
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Product & Quantity</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Select Product *</label>
                  <select
                    {...register('productId')}
                    className={cn(
                      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                      errors.productId && 'border-red-500'
                    )}
                  >
                    <option value="">Choose a product...</option>
                    {preselectedProductId && preselectedProductName && !products.find(p => p._id === preselectedProductId) && (
                      <option value={preselectedProductId}>{preselectedProductName}</option>
                    )}
                    {products.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.categoryId?.name ? `${p.categoryId.name} — ` : ''}{p.name}
                      </option>
                    ))}
                  </select>
                  {errors.productId && <p className="text-xs text-red-500 mt-1">{errors.productId.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Quantity *</label>
                  <Input
                    type="number"
                    {...register('quantity', { valueAsNumber: true, min: { value: 1, message: 'Min 1' } })}
                    min={1}
                    className={cn(errors.quantity && 'border-red-500')}
                  />
                  {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
                </div>
              </div>
            </div>

            {/* Additional Message */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Additional Details *</label>
              <textarea
                {...register('message')}
                rows={4}
                placeholder="Please specify any special requirements, configurations, or questions..."
                className={cn(
                  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  errors.message && 'border-red-500'
                )}
              />
              {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto" size="lg">
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Inquiry
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
