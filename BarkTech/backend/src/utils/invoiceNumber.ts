/** Generate unique invoice numbers in Bark format: BARK26-27S001 */

export function generateInvoiceNumber(sequenceNumber: number): string {
  const now = new Date();
  const yearShort = String(now.getFullYear()).slice(-2);
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyShort = String(fyStart).slice(-2);
  const fyEnd = fyStart + 1;
  const fyEndShort = String(fyEnd).slice(-2);
  
  return `BARK${fyShort}-${fyEndShort}S${String(sequenceNumber).padStart(3, '0')}`;
}

export function parseInvoiceNumber(invoiceNumber: string): { fyStart: number; fyEnd: number; sequence: number } | null {
  const match = invoiceNumber.match(/BARK(\d{2})-(\d{2})S(\d+)/);
  if (!match) return null;
  return {
    fyStart: 2000 + parseInt(match[1]),
    fyEnd: 2000 + parseInt(match[2]),
    sequence: parseInt(match[3]),
  };
}
