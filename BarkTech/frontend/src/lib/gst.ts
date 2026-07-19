/**
 * GST rates commonly used in India
 */
export const GST_RATES = [0, 5, 12, 18, 28] as const;

export type GSTRate = (typeof GST_RATES)[number];

export interface GSTBreakdown {
  baseAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
  isInterState: boolean;
}

export interface LineItemGST {
  description: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
}

/**
 * Determine if a transaction is inter-state based on origin/destination state codes.
 * HSN state codes: 01-37 are Indian states/UTs.
 */
function isInterState(originStateCode?: string, destStateCode?: string): boolean {
  if (!originStateCode || !destStateCode) return false;
  return originStateCode !== destStateCode;
}

/**
 * Calculate GST for a given amount.
 * For intra-state: CGST + SGST (each half of GST rate)
 * For inter-state: IGST (full GST rate)
 */
export function calculateGST(
  amount: number,
  gstRate: number,
  originStateCode?: string,
  destStateCode?: string
): GSTBreakdown {
  const baseAmount = Math.round(amount * 100) / 100;
  const interState = isInterState(originStateCode, destStateCode);

  const totalTax = Math.round(baseAmount * (gstRate / 100) * 100) / 100;
  const halfTax = Math.round(totalTax / 2 * 100) / 100;

  return {
    baseAmount,
    gstRate,
    cgst: interState ? 0 : halfTax,
    sgst: interState ? 0 : halfTax,
    igst: interState ? totalTax : 0,
    totalTax,
    totalAmount: Math.round((baseAmount + totalTax) * 100) / 100,
    isInterState: interState,
  };
}

/**
 * Calculate GST breakdown for a single line item.
 * Handles quantity, unit price, and discount before applying GST.
 */
export function calculateLineItemGST(
  item: {
    description: string;
    hsnCode?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    gstRate: number;
  },
  originStateCode?: string,
  destStateCode?: string
): LineItemGST {
  const grossAmount = item.quantity * item.unitPrice;
  const discount = item.discount ?? 0;
  const taxableAmount = Math.max(0, grossAmount - discount);

  const gstBreakdown = calculateGST(taxableAmount, item.gstRate, originStateCode, destStateCode);

  return {
    description: item.description,
    hsnCode: item.hsnCode,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount,
    taxableAmount: gstBreakdown.baseAmount,
    gstRate: item.gstRate,
    cgst: gstBreakdown.cgst,
    sgst: gstBreakdown.sgst,
    igst: gstBreakdown.igst,
    totalTax: gstBreakdown.totalTax,
    totalAmount: gstBreakdown.totalAmount,
  };
}

// ─── Indian Number System ──────────────────────────────────────

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function convertGroup(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) {
    return TENS[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ONES[n % 10] : '');
  }
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertGroup(n % 100) : '');
}

/**
 * Convert a number to Indian-words format using the Indian numbering system
 * (lakh, crore pattern).
 *
 * Example: 1234567 → "Twelve Lakh Thirty-Four Thousand Five Hundred and Sixty Seven"
 */
export function amountInWords(amount: number): string {
  if (amount === 0) return 'Zero';

  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount * 100) / 100);

  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  const parts: string[] = [];

  if (rupees === 0) {
    parts.push('Zero');
  } else {
    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const remainder = rupees % 1000;

    if (crore > 0) parts.push(convertGroup(crore) + ' Crore');
    if (lakh > 0) parts.push(convertGroup(lakh) + ' Lakh');
    if (thousand > 0) parts.push(convertGroup(thousand) + ' Thousand');
    if (remainder > 0) parts.push(convertGroup(remainder));
  }

  let result = parts.join(' ');
  if (rupees !== 0) result += ' Rupee' + (rupees === 1 ? '' : 's');

  if (paise > 0) {
    result += ' and ' + convertGroup(paise) + ' Paisa' + (paise === 1 ? '' : 's');
  }

  result += ' Only';

  return (isNegative ? 'Minus ' : '') + result;
}
