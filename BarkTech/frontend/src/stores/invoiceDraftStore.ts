import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'bark_invoice_draft';

export interface InvoiceDraftItem {
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

export interface InvoiceDraftData {
  contactName: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gstin: string;
  items: InvoiceDraftItem[];
  currency: string;
  dueDate: string;
  notes: string;
}

const DEFAULT_DRAFT: InvoiceDraftData = {
  contactName: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  gstin: '',
  items: [
    {
      description: '',
      hsnCode: '',
      quantity: 1,
      unit: 'nos',
      unitPrice: 0,
      discount: 0,
      taxRate: 18,
    },
  ],
  currency: 'INR',
  dueDate: '',
  notes: '',
};

interface InvoiceDraftState {
  formData: InvoiceDraftData;
  lastSavedAt: string | null;
  setFormData: (data: Partial<InvoiceDraftData>) => void;
  setItem: (index: number, data: Partial<InvoiceDraftItem>) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  clearDraft: () => void;
  hasDraft: () => boolean;
}

export const useInvoiceDraftStore = create<InvoiceDraftState>()(
  persist(
    (set, get) => ({
      formData: { ...DEFAULT_DRAFT },
      lastSavedAt: null,

      setFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
          lastSavedAt: new Date().toISOString(),
        })),

      setItem: (index, data) =>
        set((state) => {
          const items = [...state.formData.items];
          if (items[index]) {
            items[index] = { ...items[index], ...data };
          }
          return {
            formData: { ...state.formData, items },
            lastSavedAt: new Date().toISOString(),
          };
        }),

      addItem: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            items: [
              ...state.formData.items,
              {
                description: '',
                hsnCode: '',
                quantity: 1,
                unit: 'nos',
                unitPrice: 0,
                discount: 0,
                taxRate: 18,
              },
            ],
          },
          lastSavedAt: new Date().toISOString(),
        })),

      removeItem: (index) =>
        set((state) => {
          const items = state.formData.items.filter((_, i) => i !== index);
          // Always keep at least one item
          if (items.length === 0) {
            items.push({ ...DEFAULT_DRAFT.items[0] });
          }
          return {
            formData: { ...state.formData, items },
            lastSavedAt: new Date().toISOString(),
          };
        }),

      clearDraft: () =>
        set({
          formData: { ...DEFAULT_DRAFT },
          lastSavedAt: null,
        }),

      hasDraft: () => {
        const { formData } = get();
        return (
          formData.contactName !== '' ||
          formData.email !== '' ||
          formData.company !== '' ||
          formData.items.some((item) => item.description !== '' || item.unitPrice > 0)
        );
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        formData: state.formData,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);
