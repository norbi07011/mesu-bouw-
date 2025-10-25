import QRCode from 'qrcode';
import { Company, Invoice, Client, InvoiceLine } from '@/types';
import { formatCurrency, formatDate, generateSEPAQRPayload } from '@/lib/invoice-utils';

export async function generateInvoicePDF(
  invoice: Invoice,
  company: Company,
  client: Client,
  lines: InvoiceLine[],
  language: string
): Promise<void> {
  const qrDataUrl = await QRCode.toDataURL(invoice.payment_qr_payload, {
    width: 200,
    margin: 1,
  });

  const t = getTranslations(language);

  const html = `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.invoice} ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 15mm; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #000;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
    }
    .company-info { flex: 1; }
    .invoice-title {
      font-size: 24pt;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14pt;
      font-weight: 600;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 40px;
    }
    .party {
      flex: 1;
    }
    .party-title {
      font-weight: 700;
      font-size: 11pt;
      margin-bottom: 8px;
      text-transform: uppercase;
      color: #666;
    }
    .party-content {
      line-height: 1.6;
    }
    .dates {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 10px;
      background: #f5f5f5;
    }
    .date-item {
      font-size: 9pt;
    }
    .date-label {
      font-weight: 600;
      margin-right: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #000;
      color: #fff;
      padding: 10px 8px;
      text-align: left;
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    th.right, td.right {
      text-align: right;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
      font-size: 9pt;
    }
    .mono {
      font-family: 'JetBrains Mono', monospace;
    }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-bottom: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid #ddd;
    }
    .total-row.final {
      background: #000;
      color: #fff;
      font-weight: 700;
      font-size: 12pt;
      margin-top: 4px;
    }
    .payment-section {
      display: flex;
      gap: 30px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #000;
    }
    .payment-details {
      flex: 1;
    }
    .payment-title {
      font-weight: 700;
      font-size: 11pt;
      margin-bottom: 10px;
    }
    .payment-info {
      line-height: 1.8;
      font-size: 9pt;
    }
    .qr-section {
      text-align: center;
    }
    .qr-image {
      width: 160px;
      height: 160px;
      margin-bottom: 8px;
    }
    .qr-label {
      font-size: 8pt;
      font-weight: 600;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 8pt;
      color: #666;
    }
    .note {
      margin-top: 20px;
      padding: 12px;
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <div class="invoice-title">${t.invoice}</div>
      <div class="invoice-number">${invoice.invoice_number}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-title">${t.seller}</div>
      <div class="party-content">
        <strong>${company.name}</strong><br>
        ${company.address}<br>
        KVK: ${company.kvk}<br>
        ${t.vatNumber}: ${company.vat_number}<br>
        ${company.email}
      </div>
    </div>
    <div class="party">
      <div class="party-title">${t.buyer}</div>
      <div class="party-content">
        <strong>${client.name}</strong><br>
        ${client.address}<br>
        ${client.vat_number ? `${t.vatNumber}: ${client.vat_number}<br>` : ''}
        ${client.email}
      </div>
    </div>
  </div>

  <div class="dates">
    <div class="date-item">
      <span class="date-label">${t.issueDate}:</span>
      <span class="mono">${formatDate(invoice.issue_date, language)}</span>
    </div>
    <div class="date-item">
      <span class="date-label">${t.dueDate}:</span>
      <span class="mono">${formatDate(invoice.due_date, language)}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">${t.no}</th>
        <th>${t.description}</th>
        <th class="right" style="width: 70px;">${t.quantity}</th>
        <th class="right" style="width: 90px;">${t.unitPrice}</th>
        <th class="right" style="width: 60px;">${t.vatRate}</th>
        <th class="right" style="width: 90px;">${t.net}</th>
        <th class="right" style="width: 90px;">${t.vat}</th>
        <th class="right" style="width: 100px;">${t.gross}</th>
      </tr>
    </thead>
    <tbody>
      ${lines.map((line, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${line.description}</td>
          <td class="right mono">${line.quantity}</td>
          <td class="right mono">${formatCurrency(line.unit_price, language)}</td>
          <td class="right mono">${line.vat_rate}%</td>
          <td class="right mono">${formatCurrency(line.line_net, language)}</td>
          <td class="right mono">${formatCurrency(line.line_vat, language)}</td>
          <td class="right mono"><strong>${formatCurrency(line.line_gross, language)}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>${t.totalNet}:</span>
      <span class="mono">${formatCurrency(invoice.total_net, language)}</span>
    </div>
    <div class="total-row">
      <span>${t.totalVat}:</span>
      <span class="mono">${formatCurrency(invoice.total_vat, language)}</span>
    </div>
    <div class="total-row final">
      <span>${t.total}:</span>
      <span class="mono">${formatCurrency(invoice.total_gross, language)}</span>
    </div>
  </div>

  ${invoice.vat_note ? `
    <div class="note">
      ${invoice.vat_note}
    </div>
  ` : ''}

  <div class="payment-section">
    <div class="payment-details">
      <div class="payment-title">${t.paymentDetails}</div>
      <div class="payment-info">
        <strong>${company.name}</strong><br>
        IBAN: <span class="mono">${company.iban}</span><br>
        BIC: <span class="mono">${company.bic}</span><br>
        ${t.amount}: <span class="mono"><strong>${formatCurrency(invoice.total_gross, language)}</strong></span><br>
        ${t.reference}: <span class="mono">${invoice.invoice_number}</span>
      </div>
    </div>
    <div class="qr-section">
      <img src="${qrDataUrl}" alt="QR Code" class="qr-image">
      <div class="qr-label">${t.scanToPay}</div>
    </div>
  </div>

  <div class="footer">
    ${company.name} · KVK ${company.kvk} · BTW ${company.vat_number} · IBAN ${company.iban} · ${company.bic}
  </div>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.invoice_number}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getTranslations(language: string) {
  const translations: Record<string, any> = {
    pl: {
      invoice: 'Faktura VAT',
      issueDate: 'Data wystawienia',
      dueDate: 'Termin płatności',
      invoiceNumber: 'Numer faktury',
      seller: 'Sprzedawca',
      buyer: 'Nabywca',
      no: 'LP',
      description: 'Opis',
      quantity: 'Ilość',
      unitPrice: 'Cena jedn.',
      vatRate: 'VAT',
      vatNumber: 'NIP',
      net: 'Netto',
      vat: 'VAT',
      gross: 'Brutto',
      total: 'Razem',
      totalNet: 'Suma netto',
      totalVat: 'Suma VAT',
      totalGross: 'Suma brutto',
      paymentDetails: 'Dane do płatności',
      scanToPay: 'Zeskanuj, aby zapłacić',
      amount: 'Kwota',
      reference: 'Tytuł przelewu',
    },
    nl: {
      invoice: 'BTW-factuur',
      issueDate: 'Factuurdatum',
      dueDate: 'Vervaldatum',
      invoiceNumber: 'Factuurnummer',
      seller: 'Verkoper',
      buyer: 'Koper',
      no: 'Nr.',
      description: 'Omschrijving',
      quantity: 'Aantal',
      unitPrice: 'Prijs',
      vatRate: 'BTW',
      vatNumber: 'BTW-nummer',
      net: 'Netto',
      vat: 'BTW',
      gross: 'Bruto',
      total: 'Totaal',
      totalNet: 'Totaal netto',
      totalVat: 'Totaal BTW',
      totalGross: 'Totaal bruto',
      paymentDetails: 'Betaalgegevens',
      scanToPay: 'Scan om te betalen',
      amount: 'Bedrag',
      reference: 'Referentie',
    },
    en: {
      invoice: 'VAT Invoice',
      issueDate: 'Issue Date',
      dueDate: 'Due Date',
      invoiceNumber: 'Invoice Number',
      seller: 'Seller',
      buyer: 'Buyer',
      no: 'No.',
      description: 'Description',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      vatRate: 'VAT',
      vatNumber: 'VAT Number',
      net: 'Net',
      vat: 'VAT',
      gross: 'Gross',
      total: 'Total',
      totalNet: 'Total Net',
      totalVat: 'Total VAT',
      totalGross: 'Total Gross',
      paymentDetails: 'Payment Details',
      scanToPay: 'Scan to Pay',
      amount: 'Amount',
      reference: 'Reference',
    },
  };

  return translations[language] || translations['en'];
}
