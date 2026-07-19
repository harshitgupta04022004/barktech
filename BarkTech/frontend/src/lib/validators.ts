import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof RegisterSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;

export const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().max(200).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  specs: z
    .array(
      z.object({
        key: z.string().min(1, 'Spec key is required'),
        value: z.string().min(1, 'Spec value is required'),
      })
    )
    .optional(),
  price: z.number().positive().optional(),
  priceUnit: z.string().optional(),
  moq: z.number().int().positive().optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export type ProductFormData = z.infer<typeof ProductSchema>;

export const ContactSchema = z.object({
  contactName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number').optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  rfqItems: z
    .array(
      z.object({
        productName: z.string().min(1, 'Product name is required'),
        quantity: z.number().int().positive('Quantity must be at least 1'),
        unit: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

export type ContactFormData = z.infer<typeof ContactSchema>;

export const InquirySchema = z.object({
  contactName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string().optional(),
  status: z
    .enum(['new', 'contacted', 'qualified', 'quoted', 'won', 'lost'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
});

export type InquiryFormData = z.infer<typeof InquirySchema>;

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  hsnCode: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  discount: z.number().nonnegative().optional(),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
});

export type InvoiceItemFormData = z.infer<typeof InvoiceItemSchema>;

export const InvoiceSchema = z.object({
  contactName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
  currency: z.string().default('INR'),
  status: z
    .enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .default('draft'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export type InvoiceFormData = z.infer<typeof InvoiceSchema>;
