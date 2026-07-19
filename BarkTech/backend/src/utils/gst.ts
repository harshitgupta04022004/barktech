/** GST calculation utilities for Indian tax system */

export interface GSTBreakdown {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
}

export function calculateGST(subtotal: number, gstRate: number, isInterstate: boolean = false): GSTBreakdown {
  const totalTax = subtotal * (gstRate / 100);
  const cgst = isInterstate ? 0 : totalTax / 2;
  const sgst = isInterstate ? 0 : totalTax / 2;
  const igst = isInterstate ? totalTax : 0;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    igst: Math.round(igst * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    grandTotal: Math.round((subtotal + totalTax) * 100) / 100,
  };
}

export function calculateLineItemGST(quantity: number, unitPrice: number, gstRate: number): GSTBreakdown {
  const subtotal = quantity * unitPrice;
  return calculateGST(subtotal, gstRate);
}
