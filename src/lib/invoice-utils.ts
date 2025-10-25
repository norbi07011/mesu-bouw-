export function generateInvoiceNumber(year: number, month: number, seq: number): string {
  const yearStr = year.toString();
  const monthStr = month.toString().padStart(2, '0');
  const seqStr = seq.toString().padStart(3, '0');
  return `FV-${yearStr}-${monthStr}-${seqStr}`;
}

export function calculateLineTotals(quantity: number, unitPrice: number, vatRate: number) {
  const lineNet = Math.round(quantity * unitPrice * 100) / 100;
  const lineVat = Math.round(lineNet * (vatRate / 100) * 100) / 100;
  const lineGross = Math.round((lineNet + lineVat) * 100) / 100;
  
  return { lineNet, lineVat, lineGross };
}

export function calculateInvoiceTotals(lines: Array<{ line_net: number; line_vat: number; line_gross: number }>) {
  const totalNet = Math.round(lines.reduce((sum, line) => sum + line.line_net, 0) * 100) / 100;
  const totalVat = Math.round(lines.reduce((sum, line) => sum + line.line_vat, 0) * 100) / 100;
  const totalGross = Math.round(lines.reduce((sum, line) => sum + line.line_gross, 0) * 100) / 100;
  
  return { totalNet, totalVat, totalGross };
}

export function formatCurrency(amount: number, locale: string = 'nl-NL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string, locale: string = 'nl-NL'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

export function addDays(date: string, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

export function generateSEPAQRPayload(
  bic: string,
  name: string,
  iban: string,
  amount: number,
  reference: string,
  information: string
): string {
  const lines = [
    'BCD',
    '002',
    '1',
    'SCT',
    bic,
    name,
    iban,
    `EUR${amount.toFixed(2)}`,
    '',
    '',
    reference,
    information,
  ];
  
  return lines.join('\n');
}

export function getNextInvoiceNumber(
  counters: Map<string, number>,
  issueDate: string
): { number: string; year: number; month: number; seq: number } {
  const date = new Date(issueDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  const key = `${year}-${month}`;
  const currentSeq = counters.get(key) || 0;
  const nextSeq = currentSeq + 1;
  
  counters.set(key, nextSeq);
  
  return {
    number: generateInvoiceNumber(year, month, nextSeq),
    year,
    month,
    seq: nextSeq,
  };
}
