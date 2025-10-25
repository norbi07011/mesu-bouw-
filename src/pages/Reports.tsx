import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Invoice, Client } from '@/types';
import { formatCurrency } from '@/lib/invoice-utils';
import { DownloadSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function Reports() {
  const { t, i18n } = useTranslation();
  const [invoices] = useKV<Invoice[]>('invoices', []);
  const [clients] = useKV<Client[]>('clients', []);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    (invoices || []).forEach(inv => {
      const year = new Date(inv.issue_date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [invoices]);

  const report = useMemo(() => {
    const year = parseInt(selectedYear);
    const yearInvoices = (invoices || []).filter(inv => {
      const invYear = new Date(inv.issue_date).getFullYear();
      return invYear === year;
    });

    const totalNet = yearInvoices.reduce((sum, inv) => sum + inv.total_net, 0);
    const totalVat = yearInvoices.reduce((sum, inv) => sum + inv.total_vat, 0);
    const totalGross = yearInvoices.reduce((sum, inv) => sum + inv.total_gross, 0);

    const clientTotals = new Map<string, { name: string; total: number; count: number }>();
    yearInvoices.forEach(inv => {
      const client = clients?.find(c => c.id === inv.client_id);
      const clientName = client?.name || 'Unknown';
      const existing = clientTotals.get(inv.client_id) || { name: clientName, total: 0, count: 0 };
      clientTotals.set(inv.client_id, {
        name: clientName,
        total: existing.total + inv.total_gross,
        count: existing.count + 1,
      });
    });

    const topClients = Array.from(clientTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthInvoices = yearInvoices.filter(inv => {
        const invMonth = new Date(inv.issue_date).getMonth() + 1;
        return invMonth === month;
      });
      return {
        month,
        monthName: t(`months.${month}`),
        total: monthInvoices.reduce((sum, inv) => sum + inv.total_gross, 0),
        count: monthInvoices.length,
      };
    });

    return {
      totalNet,
      totalVat,
      totalGross,
      invoiceCount: yearInvoices.length,
      topClients,
      monthlyData,
    };
  }, [selectedYear, invoices, clients, t]);

  const handleExportCSV = () => {
    const year = parseInt(selectedYear);
    const yearInvoices = (invoices || []).filter(inv => {
      const invYear = new Date(inv.issue_date).getFullYear();
      return invYear === year;
    });

    const headers = [
      'Invoice Number',
      'Client',
      'Issue Date',
      'Due Date',
      'Net',
      'VAT',
      'Gross',
      'Status',
    ];

    const rows = yearInvoices.map(inv => {
      const client = clients?.find(c => c.id === inv.client_id);
      return [
        inv.invoice_number,
        client?.name || 'Unknown',
        inv.issue_date,
        inv.due_date,
        inv.total_net.toFixed(2),
        inv.total_vat.toFixed(2),
        inv.total_gross.toFixed(2),
        inv.status,
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices-${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  if (availableYears.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-3xl font-semibold mb-6">{t('reports.title')}</h1>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">{t('reports.noData')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t('reports.title')}</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV}>
            <DownloadSimple className="mr-2" />
            {t('reports.exportCSV')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalNet')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(report.totalNet, i18n.language)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalVat')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(report.totalVat, i18n.language)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalGross')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(report.totalGross, i18n.language)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.invoiceCount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{report.invoiceCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.monthlyRevenue')}</CardTitle>
          <CardDescription>Revenue by month for {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, i18n.language)}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="total" fill="oklch(0.45 0.15 250)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.topClients')}</CardTitle>
          <CardDescription>Top clients by revenue for {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          {report.topClients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('reports.noData')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.clientName')}</TableHead>
                  <TableHead className="text-right">{t('reports.revenue')}</TableHead>
                  <TableHead className="text-right">{t('reports.invoices')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.topClients.map((client, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(client.total, i18n.language)}
                    </TableCell>
                    <TableCell className="text-right font-mono">{client.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
