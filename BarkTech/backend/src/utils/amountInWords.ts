/** Convert number to Indian currency words */

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertHundreds(num: number): string {
  if (num === 0) return '';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + convertHundreds(num % 100) : '');
}

function convertThousands(num: number): string {
  if (num === 0) return '';
  if (num < 100) return convertHundreds(num);
  if (num < 1000) return convertHundreds(num);
  if (num < 100000) return convertHundreds(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convertHundreds(num % 1000) : '');
  if (num < 10000000) return convertHundreds(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convertThousands(num % 100000) : '');
  return convertHundreds(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convertThousands(num % 10000000) : '');
}

export function amountInWords(amount: number): string {
  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 100);
  
  let words = convertThousands(intPart);
  if (!words) words = 'Zero';
  
  let result = 'Indian Rupees ' + words + ' Only';
  if (decPart > 0) {
    result += ' and ' + convertHundreds(decPart) + ' Paise';
  }
  
  return result;
}
