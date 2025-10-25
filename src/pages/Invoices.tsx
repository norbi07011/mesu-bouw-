import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Plus, FileText, DownloadSimple, CheckCircle, FilePdf, FileCsv, FileCode, FileXls } from '@phosphor-icons/react';
import { Invoice, Client, Company } from '@/types';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { exportToCSV, exportToJSON, exportToExcel, exportToXML } from '@/lib/export-utils';

interface InvoicesProps {
  onNavigate: (page: string) => void;
}

export default function Invoices({ onNavigate }: InvoicesProps) {
  const { t, i18n } = useTranslation();
  const [invoices, setInvoices] = useKV<Invoice[]>('invoices', []);
  const [clients] = useKV<Client[]>('clients', []);
  const [company] = useKV<Company | undefined>('company', undefined);

  const sortedInvoices = useMemo(() => {
    return (invoices || []).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [invoices]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      unpaid: 'destructive',
      partial: 'secondary',
      cancelled: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{t(`invoices.${status}`)}</Badge>;
  };

  const handleGeneratePDF = async (invoice: Invoice) => {
    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client || !company) {
      toast.error('Missing data');
      return;
    }

    try {
      await generateInvoicePDF(invoice, company, client, invoice.lines, i18n.language);
      toast.success('PDF generated');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    }
  };

  const handleExportCSV = async (invoice: Invoice) => {
    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client || !company) {
      toast.error('Missing data');
      return;
    }
    try {
      await exportToCSV(invoice, company, client);
      toast.success('CSV exported');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    }
  };

  const handleExportJSON = async (invoice: Invoice) => {
    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client || !company) {
      toast.error('Missing data');
      return;
    }
    try {
      await exportToJSON(invoice, company, client);
      toast.success('JSON exported');
    } catch (error) {
      toast.error('Failed to export JSON');
      console.error(error);
    }
  };

  const handleExportExcel = async (invoice: Invoice) => {
    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client || !company) {
      toast.error('Missing data');
      return;
    }
    try {
      await exportToExcel(invoice, company, client);
      toast.success('Excel exported');
    } catch (error) {
      toast.error('Failed to export Excel');
      console.error(error);
    }
  };

  const handleExportXML = async (invoice: Invoice) => {
    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client || !company) {
      toast.error('Missing data');
      return;
    }
    try {
      await exportToXML(invoice, company, client);
      toast.success('XML exported');
    } catch (error) {
      toast.error('Failed to export XML');
      console.error(error);
    }
  };

  const handleMarkPaid = (invoiceId: string) => {
    setInvoices((prev) =>
      (prev || []).map((inv) =>
        inv.id === invoiceId
          ? { ...inv, status: 'paid' as const, updated_at: new Date().toISOString() }
          : inv
      )
    );
    toast.success('Invoice marked as paid');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">{t('invoices.title')}</h1>
        <Button onClick={() => onNavigate('invoices-new')} size="lg">
          <Plus className="mr-2" />
          {t('invoices.newInvoice')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('invoices.title')}</CardTitle>
          <CardDescription>Manage and generate invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-lg font-medium mb-2">{t('invoices.noInvoices')}</p>
              <p className="text-sm text-muted-foreground mb-4">{t('invoices.createFirst')}</p>
              <Button onClick={() => onNavigate('invoices-new')}>
                <Plus className="mr-2" />
                {t('invoices.newInvoice')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoices.invoiceNumber')}</TableHead>
                    <TableHead>{t('invoices.client')}</TableHead>
                    <TableHead>{t('invoices.issueDate')}</TableHead>
                    <TableHead>{t('invoices.dueDate')}</TableHead>
                    <TableHead className="text-right">{t('invoices.total')}</TableHead>
                    <TableHead>{t('invoices.status')}</TableHead>
                    <TableHead className="text-right">{t('invoices.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInvoices.map((invoice) => {
                    const client = clients?.find(c => c.id === invoice.client_id);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono font-semibold">{invoice.invoice_number}</TableCell>
                        <TableCell>{client?.name || 'Unknown'}</TableCell>
                        <TableCell className="font-mono text-sm">{formatDate(invoice.issue_date, i18n.language)}</TableCell>
                        <TableCell className="font-mono text-sm">{formatDate(invoice.due_date, i18n.language)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(invoice.total_gross, i18n.language)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Download invoice"
                                >
                                  <DownloadSimple />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleGeneratePDF(invoice)}>
                                  <FilePdf className="mr-2" size={16} />
                                  Download PDF/HTML
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportExcel(invoice)}>
                                  <FileXls className="mr-2" size={16} />
                                  Download Excel
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleExportCSV(invoice)}>
                                  <FileCsv className="mr-2" size={16} />
                                  Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportJSON(invoice)}>
                                  <FileCode className="mr-2" size={16} />
                                  Export as JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportXML(invoice)}>
                                  <FileCode className="mr-2" size={16} />
                                  Export as XML
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {invoice.status !== 'paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkPaid(invoice.id)}
                                title={t('invoices.markPaid')}
                              >
                                <CheckCircle />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
