import QRCode from 'qrcode';
import { Company, Invoice, Client, InvoiceLine } from '@/types';
import { formatCurrency, formatDate, getISOWeekNumber } from '@/lib/invoice-utils';
import { getTemplateById } from '@/lib/invoice-templates';

async function imageUrlToBase64(url: string): Promise<string> {
  try {
    if (url.startsWith('data:')) {
      return url;
    }
    
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    return '';
  }
}

export async function generateInvoicePDF(
  invoice: Invoice,
  company: Company,
  client: Client,
  lines: InvoiceLine[],
  language: string,
  templateId: string = 'classic'
): Promise<void> {
  try {
    const template = getTemplateById(templateId);
    
    // Wygeneruj QR kod dla SEPA płatności (EPC standard)
    console.log('Generating QR code with payload:', invoice.payment_qr_payload);
    
    const qrDataUrl = await QRCode.toDataURL(invoice.payment_qr_payload, {
      errorCorrectionLevel: 'M',  // Medium - wymagane dla SEPA
      type: 'image/png',
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log('QR code generated successfully');

    let logoDataUrl = '';
    if (template.config.showLogo && company.logo_url) {
      logoDataUrl = await imageUrlToBase64(company.logo_url);
    }

    const weekNumber = getISOWeekNumber(invoice.issue_date).toString();
    const t = getTranslations(language);

    const html = generateTemplateHTML(invoice, company, client, lines, template, qrDataUrl, weekNumber, t, language, logoDataUrl);

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoice_number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
    }, 100);
    
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

function generateTemplateHTML(
  invoice: Invoice,
  company: Company,
  client: Client,
  lines: InvoiceLine[],
  template: any,
  qrCodeUrl: string,
  weekNumber: string,
  t: any,
  language: string,
  logoDataUrl: string
): string {
  const primaryColor = template.config.primaryColor;
  const accentColor = template.config.accentColor;
  
  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.invoice} ${invoice.invoice_number}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${getTemplateStyles(template)}
  </style>
</head>
<body>
  ${getTemplateBody(invoice, company, client, lines, template, qrCodeUrl, weekNumber, t, language, logoDataUrl)}
</body>
</html>
  `;
}

function getTemplateStyles(template: any): string {
  const primaryColor = template.config.primaryColor;
  const accentColor = template.config.accentColor;
  
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 12mm; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      img { max-width: 100%; height: auto; }
    }
    body {
      font-family: '${template.config.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 20px;
      max-width: 210mm;
      margin: 0 auto;
    }
    .container { max-width: 100%; }
    .header { margin-bottom: 30px; }
    .logo { max-width: 80px; max-height: 80px; object-fit: contain; display: block; margin-bottom: 10px; }
    .company-name { font-size: 20pt; font-weight: 700; color: ${primaryColor}; margin-bottom: 8px; }
    .invoice-title { font-size: 24pt; font-weight: 700; color: ${accentColor}; }
    .invoice-number { font-size: 16pt; font-weight: 600; font-family: monospace; margin-top: 4px; }
    .week-number { font-size: 9pt; color: #666; margin-top: 4px; }
    .section-title { font-size: 10pt; font-weight: 600; text-transform: uppercase; color: ${primaryColor}; margin-bottom: 8px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .party-content { line-height: 1.6; font-size: 9pt; }
    .party-content strong { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    thead { background-color: ${primaryColor}; color: white; }
    th { padding: 10px 8px; text-align: left; font-size: 8pt; font-weight: 600; text-transform: uppercase; }
    th.right, td.right { text-align: right; }
    td { padding: 8px; border-bottom: 1px solid #e0e0e0; font-size: 9pt; }
    tbody tr:nth-child(even) { background-color: #f9f9f9; }
    .totals { margin-left: auto; width: 300px; margin-top: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #e0e0e0; font-size: 9pt; }
    .total-row.final { background-color: ${accentColor}; color: white; font-weight: 700; font-size: 11pt; margin-top: 4px; padding: 12px; }
    .payment-section { display: flex; gap: 30px; margin-top: 30px; padding-top: 20px; border-top: 2px solid ${primaryColor}; }
    .payment-details { flex: 1; }
    .payment-info { line-height: 1.8; font-size: 9pt; }
    .qr-section { text-align: center; }
    .qr-image { width: 140px; height: 140px; display: block; margin: 0 auto; }
    .qr-label { font-size: 8pt; font-weight: 600; margin-top: 8px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 7pt; color: #666; }
    .note { margin-top: 15px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; font-size: 9pt; }
    .mono { font-family: monospace; }
  `;
}

function getTemplateBody(
  invoice: Invoice,
  company: Company,
  client: Client,
  lines: InvoiceLine[],
  template: any,
  qrCodeUrl: string,
  weekNumber: string,
  t: any,
  language: string,
  logoDataUrl: string
): string {
  const escapeHtml = (text: string | undefined | null): string => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  return `
    <div class="container">
      <div class="header" style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid ${template.config.primaryColor};">
        <div>
          ${template.config.showLogo && logoDataUrl ? `<img src="${logoDataUrl}" alt="Company Logo" class="logo" style="max-width: 80px; max-height: 80px; object-fit: contain; margin-bottom: 10px;">` : ''}
          <div class="company-name">${escapeHtml(company.name)}</div>
          <div style="font-size: 9pt; color: #666; line-height: 1.6;">
            ${escapeHtml(company.address)}<br>
            KVK: ${escapeHtml(company.kvk)} | BTW: ${escapeHtml(company.vat_number)}<br>
            ${escapeHtml(company.email)}
          </div>
        </div>
        <div style="text-align: right;">
          <div class="invoice-title">${t.invoice}</div>
          <div class="invoice-number">${escapeHtml(invoice.invoice_number)}</div>
          ${template.config.showWeekNumber ? `<div class="week-number">Week ${weekNumber}</div>` : ''}
        </div>
      </div>

      <div class="grid-2">
        <div>
          <div class="section-title">${t.buyer}</div>
          <div class="party-content">
            <strong>${escapeHtml(client.name)}</strong><br>
            ${escapeHtml(client.address)}${client.vat_number ? `<br>BTW: ${escapeHtml(client.vat_number)}` : ''}
          </div>
        </div>
        <div>
          <div class="section-title">${t.invoiceDetails}</div>
          <div class="party-content">
            <strong>${t.issueDate}:</strong> ${formatDate(invoice.issue_date, language)}<br>
            <strong>${t.dueDate}:</strong> ${formatDate(invoice.due_date, language)}<br>
            <strong>${t.reference}:</strong> ${escapeHtml(invoice.payment_reference)}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>${t.description}</th>
            <th class="right" style="width: 70px;">${t.quantity}</th>
            <th class="right" style="width: 90px;">${t.unitPrice}</th>
            <th class="right" style="width: 60px;">${t.vatRate}</th>
            <th class="right" style="width: 100px;">${t.gross}</th>
          </tr>
        </thead>
        <tbody>
          ${lines.map((line, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(line.description)}</td>
              <td class="right mono">${line.quantity}</td>
              <td class="right mono">${formatCurrency(line.unit_price, language)}</td>
              <td class="right mono">${line.vat_rate}%</td>
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
          <span>${t.totalGross}:</span>
          <span class="mono">${formatCurrency(invoice.total_gross, language)}</span>
        </div>
      </div>

      ${invoice.vat_note ? `<div class="note">${escapeHtml(t.reverseChargeNote)}</div>` : ''}

      ${template.config.showBankDetails || template.config.showQRCode ? `
        <div class="payment-section">
          ${template.config.showBankDetails ? `
            <div class="payment-details">
              <div class="section-title">${t.paymentDetails}</div>
              <div class="payment-info">
                IBAN: <span class="mono">${escapeHtml(company.iban)}</span><br>
                BIC: <span class="mono">${escapeHtml(company.bic)}</span><br>
                ${t.amount}: <span class="mono"><strong>${formatCurrency(invoice.total_gross, language)}</strong></span><br>
                ${t.reference}: <span class="mono">${escapeHtml(invoice.invoice_number)}</span>
              </div>
            </div>
          ` : ''}
          ${template.config.showQRCode && qrCodeUrl ? `
            <div class="qr-section">
              <img src="${qrCodeUrl}" alt="Payment QR Code" class="qr-image" style="width: 140px; height: 140px;">
              <div class="qr-label">${t.scanToPay}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div class="footer">
        ${escapeHtml(company.name)} · KVK ${escapeHtml(company.kvk)} · BTW ${escapeHtml(company.vat_number)} · IBAN ${escapeHtml(company.iban)}
      </div>
    </div>
  `;
}

function getTranslations(language: string) {
  const translations: Record<string, any> = {
    pl: {
      invoice: 'Faktura VAT',
      issueDate: 'Data wystawienia',
      dueDate: 'Termin płatności',
      invoiceNumber: 'Numer faktury',
      invoiceDetails: 'Szczegóły faktury',
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
      reverseChargeNote: 'Odwrotne obciążenie (reverse charge) – art. 194 dyrektywy VAT',
    },
    nl: {
      invoice: 'BTW-factuur',
      issueDate: 'Factuurdatum',
      dueDate: 'Vervaldatum',
      invoiceNumber: 'Factuurnummer',
      invoiceDetails: 'Factuurgegevens',
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
      reverseChargeNote: 'Verleggingsregeling – Artikel 194 BTW-richtlijn',
    },
    en: {
      invoice: 'VAT Invoice',
      issueDate: 'Issue Date',
      dueDate: 'Due Date',
      invoiceNumber: 'Invoice Number',
      invoiceDetails: 'Invoice Details',
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
      reverseChargeNote: 'Reverse charge – Article 194 VAT Directive',
    },
  };

  return translations[language] || translations['en'];
}

/**
 * Generate BTW Declaration PDF
 * Creates a PDF document for Dutch BTW (VAT) quarterly declaration
 */
export async function generateBTWDeclarationPDF(
  declaration: any,
  company: Company,
  language: string = 'nl'
): Promise<void> {
  try {
    // Import jsPDF - use dynamic import for better compatibility
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule;
    await import('jspdf-autotable');
    
    const doc = new jsPDF();
    const t = getBTWTranslations(language);
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(t.title, 105, 20, { align: 'center' });
    
    // Company info
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(company.name, 20, 35);
    if (company.vat_number) {
      doc.text(`${t.vatNumber}: ${company.vat_number}`, 20, 41);
    }
    
    // Declaration period
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`${t.period}: ${declaration.year} - ${declaration.period}`, 105, 55, { align: 'center' });
    
    // Status badge
    doc.setFontSize(10);
    const statusText = declaration.status === 'draft' ? t.statusDraft : 
                      declaration.status === 'submitted' ? t.statusSubmitted : t.statusPaid;
    doc.text(`${t.status}: ${statusText}`, 105, 62, { align: 'center' });
    
    let yPos = 75;
    
    // Section 1: Revenue (Omzet)
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(t.revenueSection, 20, yPos);
    yPos += 8;
    
    const revenueData = [
      ['1a', t.revenue21, formatCurrency(declaration.revenue_nl_high || 0), formatCurrency(declaration.vat_high || 0)],
      ['1b', t.revenue9, formatCurrency(declaration.revenue_nl_low || 0), formatCurrency(declaration.vat_low || 0)],
      ['1c', t.revenue0, formatCurrency(declaration.revenue_nl_zero || 0), '-'],
      ['1d', t.reverseCharge, formatCurrency(declaration.revenue_nl_other || 0), '-'],
    ];
    
    if (declaration.private_use_amount) {
      revenueData.push(['1e', t.privateUse, formatCurrency(declaration.private_use_amount), formatCurrency(declaration.private_use_vat || 0)]);
    }
    
    (doc as any).autoTable({
      startY: yPos,
      head: [[t.rubric, t.description, t.netAmount, t.vatAmount]],
      body: revenueData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }, // blue-500
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Section 2: Deductible VAT (Voorbelasting)
    doc.setFontSize(12);
    doc.text(t.deductibleSection, 20, yPos);
    yPos += 8;
    
    const deductibleData = [
      ['5b', t.inputVat, formatCurrency(declaration.input_vat_general || 0)],
    ];
    
    (doc as any).autoTable({
      startY: yPos,
      head: [[t.rubric, t.description, t.vatAmount]],
      body: deductibleData,
      theme: 'striped',
      headStyles: { fillColor: [168, 85, 247] }, // purple-500
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Section 3: Calculation (Berekening)
    doc.setFontSize(12);
    doc.text(t.calculation, 20, yPos);
    yPos += 8;
    
    const calculationData = [
      [t.totalVatToPay, formatCurrency(declaration.total_vat_to_pay || 0)],
      [t.totalVatDeductible, formatCurrency(declaration.total_vat_deductible || 0)],
      [t.balance, formatCurrency(declaration.balance || 0)],
    ];
    
    (doc as any).autoTable({
      startY: yPos,
      body: calculationData,
      theme: 'plain',
      styles: { fontSize: 10, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Balance indicator
    if (declaration.balance > 0) {
      doc.setFontSize(11);
      doc.setTextColor(220, 38, 38); // red-600
      doc.text(t.toPay, 20, yPos);
    } else if (declaration.balance < 0) {
      doc.setFontSize(11);
      doc.setTextColor(22, 163, 74); // green-600
      doc.text(t.toReceive, 20, yPos);
    }
    
    // Notes section
    if (declaration.notes) {
      yPos += 15;
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(t.notes + ':', 20, yPos);
      yPos += 6;
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(declaration.notes, 170);
      doc.text(splitNotes, 20, yPos);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    const footerText = `${t.generatedOn}: ${new Date().toLocaleDateString(language)}`;
    doc.text(footerText, 105, 285, { align: 'center' });
    
    // Save PDF
    const filename = `BTW-Aangifte-${declaration.year}-${declaration.period}.pdf`;
    doc.save(filename);
    
  } catch (error) {
    console.error('Error generating BTW PDF:', error);
    throw error;
  }
}

function getBTWTranslations(language: string): any {
  const translations: any = {
    nl: {
      title: 'BTW Aangifte',
      period: 'Periode',
      status: 'Status',
      statusDraft: 'Concept',
      statusSubmitted: 'Ingediend',
      statusPaid: 'Betaald',
      vatNumber: 'BTW-nummer',
      revenueSection: 'Prestaties/Levering (Omzet)',
      deductibleSection: 'Voorbelasting',
      calculation: 'Berekening',
      rubric: 'Rubriek',
      description: 'Omschrijving',
      netAmount: 'Bedrag (netto)',
      vatAmount: 'BTW-bedrag',
      revenue21: 'Leveringen/diensten belast met hoog tarief (21%)',
      revenue9: 'Leveringen/diensten belast met laag tarief (9%)',
      revenue0: 'Leveringen/diensten belast met 0% of niet bij u belast',
      reverseCharge: 'Leveringen waarbij BTW naar u is verlegd',
      privateUse: 'Privégebruik',
      inputVat: 'Voorbelasting (algemeen)',
      totalVatToPay: 'Totaal te betalen BTW',
      totalVatDeductible: 'Totaal terug te vragen BTW',
      balance: 'Saldo',
      toPay: 'Te betalen aan Belastingdienst',
      toReceive: 'Terug te ontvangen van Belastingdienst',
      notes: 'Opmerkingen',
      generatedOn: 'Gegenereerd op',
    },
    pl: {
      title: 'Deklaracja VAT',
      period: 'Okres',
      status: 'Status',
      statusDraft: 'Szkic',
      statusSubmitted: 'Złożona',
      statusPaid: 'Opłacona',
      vatNumber: 'Numer VAT',
      revenueSection: 'Przychody',
      deductibleSection: 'VAT do odliczenia',
      calculation: 'Obliczenie',
      rubric: 'Rubryka',
      description: 'Opis',
      netAmount: 'Kwota netto',
      vatAmount: 'Kwota VAT',
      revenue21: 'Sprzedaż 21% VAT',
      revenue9: 'Sprzedaż 9% VAT',
      revenue0: 'Sprzedaż 0% VAT',
      reverseCharge: 'Odwrotne obciążenie',
      privateUse: 'Użytek prywatny',
      inputVat: 'VAT naliczony',
      totalVatToPay: 'Suma VAT do zapłaty',
      totalVatDeductible: 'Suma VAT do odliczenia',
      balance: 'Saldo',
      toPay: 'Do zapłaty',
      toReceive: 'Do otrzymania',
      notes: 'Uwagi',
      generatedOn: 'Wygenerowano',
    },
    en: {
      title: 'VAT Declaration',
      period: 'Period',
      status: 'Status',
      statusDraft: 'Draft',
      statusSubmitted: 'Submitted',
      statusPaid: 'Paid',
      vatNumber: 'VAT Number',
      revenueSection: 'Revenue',
      deductibleSection: 'Deductible VAT',
      calculation: 'Calculation',
      rubric: 'Item',
      description: 'Description',
      netAmount: 'Net Amount',
      vatAmount: 'VAT Amount',
      revenue21: 'Sales at 21% VAT',
      revenue9: 'Sales at 9% VAT',
      revenue0: 'Sales at 0% VAT',
      reverseCharge: 'Reverse Charge',
      privateUse: 'Private Use',
      inputVat: 'Input VAT',
      totalVatToPay: 'Total VAT Payable',
      totalVatDeductible: 'Total VAT Deductible',
      balance: 'Balance',
      toPay: 'To Pay',
      toReceive: 'To Receive',
      notes: 'Notes',
      generatedOn: 'Generated on',
    },
  };
  
  return translations[language] || translations['en'];
}
