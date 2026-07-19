import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, CheckCircle, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MACHINE_TYPES = [
  'Die Cutting & Creasing Machine',
  'Flute Laminator',
  'Window Patching Machine',
  'Rotary Printer',
  'Folder Gluer',
  'Single Facer Machine',
  'NC Cutter Machine',
  'Creasing Matrix Cutter',
  'Electric Mill Roll Stand',
  'Automatic Window Patching Machine',
  'Other',
];

const sparePartsSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  company: z.string().min(2, 'Company name is required'),
  machineType: z.string().min(1, 'Please select a machine type'),
  partDescription: z.string().min(5, 'Please describe the part you need'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  additionalNotes: z.string().optional(),
});

type SparePartsFormData = z.infer<typeof sparePartsSchema>;

export function SparePartsPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SparePartsFormData>({
    resolver: zodResolver(sparePartsSchema),
    defaultValues: { quantity: 1 },
  });

  const onSubmit = async (data: SparePartsFormData) => {
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
          message: `[Spare Parts Request] Machine: ${data.machineType} | Part: ${data.partDescription} | Qty: ${data.quantity}${data.additionalNotes ? `\nNotes: ${data.additionalNotes}` : ''}`,
          type: 'spare_parts',
          source: 'website_spare_parts_form',
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        reset();
      }
    } catch {
      // Silently handle error
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-black dark:text-white">Request Submitted!</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          We have received your spare parts request. Our team will contact you shortly with availability and pricing details.
        </p>
        <Button onClick={() => setSubmitted(false)} className="mt-8" variant="outline">
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Wrench className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-black dark:text-white">Spare Parts Inquiry</h1>
        <p className="mt-3 max-w-xl mx-auto text-gray-600 dark:text-gray-400">
          Need replacement parts for your Bark Technologies machinery? Fill in the form below and we will get back to you with availability.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Machine Selection */}
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Machine & Part Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Machine Type *</label>
                  <select
                    {...register('machineType')}
                    className={cn(
                      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                      errors.machineType && 'border-red-500'
                    )}
                  >
                    <option value="">Select machine type...</option>
                    {MACHINE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.machineType && <p className="text-xs text-red-500 mt-1">{errors.machineType.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Part Description *</label>
                  <textarea
                    {...register('partDescription')}
                    rows={3}
                    placeholder="Describe the spare part you need (e.g., cutting blade, rubber roller, conveyor belt, etc.)"
                    className={cn(
                      'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
                      errors.partDescription && 'border-red-500'
                    )}
                  />
                  {errors.partDescription && <p className="text-xs text-red-500 mt-1">{errors.partDescription.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Quantity *</label>
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

            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Contact Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">First Name *</label>
                  <Input {...register('firstName')} placeholder="John" className={cn(errors.firstName && 'border-red-500')} />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Last Name *</label>
                  <Input {...register('lastName')} placeholder="Doe" className={cn(errors.lastName && 'border-red-500')} />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Email *</label>
                  <Input {...register('email')} type="email" placeholder="john@company.com" className={cn(errors.email && 'border-red-500')} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Phone *</label>
                  <Input {...register('phone')} placeholder="+91 98765 43210" className={cn(errors.phone && 'border-red-500')} />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Company Name *</label>
                  <Input {...register('company')} placeholder="Acme Industries" className={cn(errors.company && 'border-red-500')} />
                  {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company.message}</p>}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Additional Notes</label>
              <textarea
                {...register('additionalNotes')}
                rows={2}
                placeholder="Any model numbers, serial numbers, or other details..."
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
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
                  Submit Spare Parts Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
