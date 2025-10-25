import { useTranslation } from 'react-i18next';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Users, Package, ChartBar } from '@phosphor-icons/react';
import { Invoice, Client } from '@/types';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import { useMemo } from 'react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { t, i18n } = useTranslation();
  const [invoices] = useKV<Invoice[]>('invoices', []);
  const [clients] = useKV<Client[]>('clients', []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const unpaidTotal = invoices
      ?.filter(inv => inv.status === 'unpaid')
      .reduce((sum, inv) => sum + inv.total_gross, 0) || 0;

    const thisMonthTotal = invoices
      ?.filter(inv => {
        const date = new Date(inv.issue_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.total_gross, 0) || 0;

    const thisYearTotal = invoices
      ?.filter(inv => {
        const date = new Date(inv.issue_date);
        return date.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.total_gross, 0) || 0;

    return {
      unpaid: unpaidTotal,
      thisMonth: thisMonthTotal,
      thisYear: thisYearTotal,
      totalInvoices: invoices?.length || 0,
    };
  }, [invoices]);

  const recentInvoices = useMemo(() => {
    return (invoices || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
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

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t('dashboard.title')}</h1>
        <Button onClick={() => onNavigate('invoices-new')} size="lg">
          <Plus className="mr-2" />
          {t('dashboard.newInvoice')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.unpaid')}</CardTitle>
            <FileText className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(stats.unpaid, i18n.language)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.thisMonth')}</CardTitle>
            <ChartBar className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(stats.thisMonth, i18n.language)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.thisYear')}</CardTitle>
            <ChartBar className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(stats.thisYear, i18n.language)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalInvoices')}</CardTitle>
            <FileText className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.totalInvoices}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentInvoices')}</CardTitle>
          <CardDescription>Latest 5 invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-lg font-medium mb-2">{t('dashboard.noInvoices')}</p>
              <p className="text-sm text-muted-foreground mb-4">{t('dashboard.createFirst')}</p>
              <Button onClick={() => onNavigate('invoices-new')}>
                <Plus className="mr-2" />
                {t('dashboard.newInvoice')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((invoice) => {
                const client = clients?.find(c => c.id === invoice.client_id);
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onNavigate(`invoices-${invoice.id}`)}
                  >
                    <div className="flex-1">
                      <div className="font-mono font-medium">{invoice.invoice_number}</div>
                      <div className="text-sm text-muted-foreground">{client?.name || 'Unknown'}</div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="font-mono font-semibold">{formatCurrency(invoice.total_gross, i18n.language)}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(invoice.issue_date, i18n.language)}</div>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
