import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash } from '@phosphor-icons/react';
import { Invoice, InvoiceLine, Client, Product, Company, InvoiceCounter } from '@/types';
import { toast } from 'sonner';
import {
  calculateLineTotals,
  calculateInvoiceTotals,
  addDays,
  generateSEPAQRPayload,
  getNextInvoiceNumber,
  formatCurrency,
} from '@/lib/invoice-utils';

interface InvoiceFormProps {
  onNavigate: (page: string) => void;
}

export default function InvoiceForm({ onNavigate }: InvoiceFormProps) {
  const { t, i18n } = useTranslation();
  const [clients] = useKV<Client[]>('clients', []);
  const [products] = useKV<Product[]>('products', []);
  const [company] = useKV<Company | undefined>('company', undefined);
  const [invoices, setInvoices] = useKV<Invoice[]>('invoices', []);
  const [counters, setCounters] = useKV<InvoiceCounter[]>('invoice_counters', []);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTermDays, setPaymentTermDays] = useState(company?.default_payment_term_days || 7);
  const [reverseCharge, setReverseCharge] = useState(false);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Array<Partial<InvoiceLine>>>([
    {
      description: '',
      quantity: 1,
      unit_price: 0,
      vat_rate: company?.default_vat_rate || 21,
    },
  ]);

  const dueDate = useMemo(() => addDays(issueDate, paymentTermDays), [issueDate, paymentTermDays]);

  const totals = useMemo(() => {
    const validLines = lines.filter(l => l.description && l.quantity && l.unit_price !== undefined && l.vat_rate !== undefined);
    const calculatedLines = validLines.map(l => {
      const actualVatRate = reverseCharge ? 0 : (l.vat_rate || 0);
      const { lineNet, lineVat, lineGross } = calculateLineTotals(l.quantity!, l.unit_price!, actualVatRate);
      return { line_net: lineNet, line_vat: lineVat, line_gross: lineGross };
    });
    return calculateInvoiceTotals(calculatedLines);
  }, [lines, reverseCharge]);

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        description: '',
        quantity: 1,
        unit_price: 0,
        vat_rate: company?.default_vat_rate || 21,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      const newLines = [...lines];
      newLines[index] = {
        ...newLines[index],
        product_id: product.id,
        description: product.name,
        unit_price: product.unit_price,
        vat_rate: product.vat_rate,
      };
      setLines(newLines);
    }
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      [field]: value,
    };
    setLines(newLines);
  };

  const handleSaveInvoice = () => {
    if (!selectedClientId) {
      toast.error('Please select a client');
      return;
    }

    if (lines.length === 0 || !lines.some(l => l.description)) {
      toast.error('Please add at least one line item');
      return;
    }

    if (!company) {
      toast.error('Company information not found');
      return;
    }

    const client = clients?.find(c => c.id === selectedClientId);
    if (!client) {
      toast.error('Client not found');
      return;
    }

    const counterMap = new Map<string, number>();
    (counters || []).forEach(c => {
      counterMap.set(`${c.year}-${c.month}`, c.last_seq);
    });

    const { number, year, month, seq } = getNextInvoiceNumber(counterMap, issueDate);

    setCounters((prev) => {
      const existing = (prev || []).find(c => c.year === year && c.month === month);
      if (existing) {
        return (prev || []).map(c =>
          c.year === year && c.month === month ? { ...c, last_seq: seq } : c
        );
      } else {
        return [...(prev || []), { year, month, last_seq: seq }];
      }
    });

    const now = new Date().toISOString();

    const invoiceLines: InvoiceLine[] = lines
      .filter(l => l.description)
      .map((l, i) => {
        const actualVatRate = reverseCharge ? 0 : (l.vat_rate || 0);
        const { lineNet, lineVat, lineGross } = calculateLineTotals(
          l.quantity!,
          l.unit_price!,
          actualVatRate
        );
        return {
          id: `line_${Date.now()}_${i}`,
          invoice_id: '',
          product_id: l.product_id,
          description: l.description!,
          quantity: l.quantity!,
          unit_price: l.unit_price!,
          vat_rate: actualVatRate,
          line_net: lineNet,
          line_vat: lineVat,
          line_gross: lineGross,
        };
      });

    const paymentReference = number;
    const paymentInfo = `${t('invoices.invoice')} ${number} – ${company.name}`;
    const qrPayload = generateSEPAQRPayload(
      company.bic,
      company.name,
      company.iban,
      totals.totalGross,
      paymentReference,
      paymentInfo
    );

    const vatNote = reverseCharge
      ? t('pdf.reverseChargeNote')
      : '';

    const newInvoice: Invoice = {
      id: `invoice_${Date.now()}`,
      invoice_number: number,
      company_id: company.id,
      client_id: selectedClientId,
      issue_date: issueDate,
      due_date: dueDate,
      currency: 'EUR',
      status: 'unpaid',
      total_net: totals.totalNet,
      total_vat: totals.totalVat,
      total_gross: totals.totalGross,
      vat_note: vatNote,
      payment_qr_payload: qrPayload,
      payment_reference: paymentReference,
      notes,
      created_at: now,
      updated_at: now,
      lines: invoiceLines.map(l => ({ ...l, invoice_id: `invoice_${Date.now()}` })),
    };

    setInvoices((prev) => [...(prev || []), newInvoice]);
    toast.success(`Invoice ${number} created`);
    onNavigate('invoices');
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">{t('invoiceForm.title')}</h1>
        <Button variant="outline" onClick={() => onNavigate('invoices')}>
          {t('common.cancel')}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Basic invoice information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">{t('invoiceForm.selectClient')}</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder={t('invoiceForm.selectClient')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients || []).map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issueDate">{t('invoiceForm.issueDate')}</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerm">{t('invoiceForm.paymentTerm')}</Label>
                <Input
                  id="paymentTerm"
                  type="number"
                  value={paymentTermDays}
                  onChange={(e) => setPaymentTermDays(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">{t('invoiceForm.dueDate')}</Label>
                <Input id="dueDate" type="date" value={dueDate} disabled />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reverseCharge"
                checked={reverseCharge}
                onCheckedChange={(checked) => setReverseCharge(checked as boolean)}
              />
              <Label htmlFor="reverseCharge" className="font-normal">
                {t('invoiceForm.reverseCharge')}
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('invoiceForm.lines')}</CardTitle>
                <CardDescription>Add products or services</CardDescription>
              </div>
              <Button onClick={handleAddLine} size="sm">
                <Plus className="mr-2" />
                {t('invoiceForm.addLine')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lines.map((line, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Line {index + 1}</span>
                    {lines.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLine(index)}
                      >
                        <Trash />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Product</Label>
                      <Select
                        value={line.product_id || ''}
                        onValueChange={(value) => handleProductSelect(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('invoiceForm.selectProduct')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ad-hoc">{t('invoiceForm.adHoc')}</SelectItem>
                          {(products || []).map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {formatCurrency(product.unit_price, i18n.language)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>{t('invoiceForm.description')}</Label>
                      <Input
                        value={line.description || ''}
                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('invoiceForm.quantity')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.quantity || 0}
                        onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('invoiceForm.unitPrice')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.unit_price || 0}
                        onChange={(e) => handleLineChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('invoiceForm.vatRate')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={reverseCharge ? 0 : (line.vat_rate || 0)}
                        onChange={(e) => handleLineChange(index, 'vat_rate', parseFloat(e.target.value) || 0)}
                        disabled={reverseCharge}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('invoiceForm.gross')}</Label>
                      <Input
                        value={formatCurrency(
                          calculateLineTotals(
                            line.quantity || 0,
                            line.unit_price || 0,
                            reverseCharge ? 0 : (line.vat_rate || 0)
                          ).lineGross,
                          i18n.language
                        )}
                        disabled
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('invoiceForm.summary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-md ml-auto">
              <div className="flex justify-between">
                <span>{t('invoiceForm.totalNet')}:</span>
                <span className="font-mono font-semibold">{formatCurrency(totals.totalNet, i18n.language)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('invoiceForm.totalVat')}:</span>
                <span className="font-mono font-semibold">{formatCurrency(totals.totalVat, i18n.language)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-primary">
                <span className="text-lg font-bold">{t('invoiceForm.totalGross')}:</span>
                <span className="text-lg font-mono font-bold">{formatCurrency(totals.totalGross, i18n.language)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => onNavigate('invoices')}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSaveInvoice} size="lg">
            {t('invoiceForm.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
