import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface InvoiceItem {
  description: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
}

interface InvoiceItemRowProps {
  index: number;
  register: UseFormRegister<{ items: InvoiceItem[] }>;
  errors: FieldErrors<{ items: InvoiceItem[] }>;
  watch: (name: `items.${number}.quantity` | `items.${number}.unitPrice` | `items.${number}.gstRate`) => number;
  onRemove: () => void;
  isLast?: boolean;
}

export function InvoiceItemRow({ index, register, errors, watch, onRemove, isLast }: InvoiceItemRowProps) {
  const quantity = watch(`items.${index}.quantity`) || 0;
  const unitPrice = watch(`items.${index}.unitPrice`) || 0;
  const gstRate = watch(`items.${index}.gstRate`) || 0;

  const lineTotal = quantity * unitPrice * (1 + gstRate / 100);

  const itemErrors = errors.items?.[index];

  return (
    <div className={cn(
      'grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-start',
      !isLast && 'pb-4 border-b border-gray-200 dark:border-gray-700'
    )}>
      {/* Description */}
      <div className="sm:col-span-4">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Description *</label>
        <Input
          {...register(`items.${index}.description`, { required: 'Description is required' })}
          placeholder="Item description"
          className={cn('text-sm', itemErrors?.description && 'border-red-500')}
        />
        {itemErrors?.description && (
          <p className="text-xs text-red-500 mt-1">{itemErrors.description.message}</p>
        )}
      </div>

      {/* HSN Code */}
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">HSN Code</label>
        <Input
          {...register(`items.${index}.hsnCode`)}
          placeholder="HSN"
          className="text-sm"
        />
      </div>

      {/* Quantity */}
      <div className="sm:col-span-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Qty *</label>
        <Input
          type="number"
          {...register(`items.${index}.quantity`, {
            required: 'Required',
            valueAsNumber: true,
            min: { value: 1, message: 'Min 1' },
          })}
          min={1}
          placeholder="0"
          className={cn('text-sm', itemErrors?.quantity && 'border-red-500')}
        />
        {itemErrors?.quantity && (
          <p className="text-xs text-red-500 mt-1">{itemErrors.quantity.message}</p>
        )}
      </div>

      {/* Unit Price */}
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Unit Price *</label>
        <Input
          type="number"
          {...register(`items.${index}.unitPrice`, {
            required: 'Required',
            valueAsNumber: true,
            min: { value: 0.01, message: 'Must be > 0' },
          })}
          min={0}
          step={0.01}
          placeholder="0.00"
          className={cn('text-sm', itemErrors?.unitPrice && 'border-red-500')}
        />
        {itemErrors?.unitPrice && (
          <p className="text-xs text-red-500 mt-1">{itemErrors.unitPrice.message}</p>
        )}
      </div>

      {/* GST Rate */}
      <div className="sm:col-span-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">GST %</label>
        <Input
          type="number"
          {...register(`items.${index}.gstRate`, {
            valueAsNumber: true,
            min: { value: 0, message: 'Min 0' },
            max: { value: 100, message: 'Max 100' },
          })}
          min={0}
          max={100}
          step={0.5}
          placeholder="18"
          className="text-sm"
        />
      </div>

      {/* Line Total */}
      <div className="sm:col-span-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Total</label>
        <div className="flex h-10 w-full items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Remove Button */}
      <div className="sm:col-span-1 flex items-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-10 w-10 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
          title="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
