import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBTW, useInvoices, useExpenses, useKilometers, useCompany } from '../hooks/useElectronDB';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  FileText,
  Download,
  Receipt,
  TrendUp,
  Calculator,
  Warning,
  Car,
  CurrencyEur,
  CheckCircle,
  Clock,
  ArrowRight,
  Calendar,
  ChartBar,
  Eye,
  Pencil,
  Trash,
  Plus
} from '@phosphor-icons/react';
import type { BTWDeclaration, BTWPeriod } from '../types';
import { generateBTWDeclarationPDF } from '../lib/pdf-generator';
import { toast } from 'sonner';

const QUARTERS: BTWPeriod[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const QUARTER_DATES = {
  Q1: { start: '-01-01', end: '-03-31', label: 'Q1 (Jan-Mar)' },
  Q2: { start: '-04-01', end: '-06-30', label: 'Q2 (Apr-Jun)' },
  Q3: { start: '-07-01', end: '-09-30', label: 'Q3 (Jul-Sep)' },
  Q4: { start: '-10-01', end: '-12-31', label: 'Q4 (Oct-Dec)' },
} as const;

export function BTWAangifte() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3) as 1 | 2 | 3 | 4;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState<BTWPeriod>(`Q${currentQuarter}` as BTWPeriod);
  const [showDeclarationForm, setShowDeclarationForm] = useState(false);

  const { declarations, loading: btwLoading, createBTW, updateBTW, deleteBTW } = useBTW();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { kilometers, loading: kilometersLoading } = useKilometers();
  const { company } = useCompany();

  // Automatyczne obliczenia BTW dla wybranego okresu
  const calculatedBTW = useMemo(() => {
    const dates = QUARTER_DATES[selectedPeriod];
    const startDate = `${selectedYear}${dates.start}`;
    const endDate = `${selectedYear}${dates.end}`;

    // Filtruj faktury dla wybranego okresu
    const periodInvoices = invoices.filter((inv: any) => {
      const invDate = inv.issue_date || inv.date;
      return invDate >= startDate && invDate <= endDate && inv.status !== 'cancelled';
    });

    // Filtruj wydatki dla wybranego okresu
    const periodExpenses = expenses.filter((exp: any) => {
      return exp.date >= startDate && exp.date <= endDate;
    });

    // Filtruj kilometry dla wybranego okresu
    const periodKilometers = kilometers.filter((km: any) => {
      return km.date >= startDate && km.date <= endDate;
    });

    // === RUBRICA 1: PRZYCHODY (Revenue) ===
    let revenue21 = 0;  // 1a - Przychody 21% VAT
    let revenue9 = 0;   // 1b - Przychody 9% VAT
    let revenue0 = 0;   // 1c - Przychody 0% VAT
    let reverseCharge = 0; // 1d - Odwrotne obciążenie (reverse charge)

    periodInvoices.forEach((inv: any) => {
      const netAmount = inv.total_net || 0;
      const vatAmount = inv.total_vat || 0;
      const vatRate = netAmount > 0 ? (vatAmount / netAmount) * 100 : 0;

      // Sprawdź czy reverse charge
      const note = (inv.vat_note || '').toLowerCase();
      if (note.includes('reverse charge') || note.includes('odwrotne')) {
        reverseCharge += netAmount;
      } else if (vatRate >= 20 && vatRate <= 22) {
        revenue21 += netAmount;
      } else if (vatRate >= 8 && vatRate <= 10) {
        revenue9 += netAmount;
      } else if (vatRate < 1) {
        revenue0 += netAmount;
      }
    });

    // === OBLICZ VAT DO ZAPŁATY ===
    const vat21 = revenue21 * 0.21;
    const vat9 = revenue9 * 0.09;

    // === RUBRICA 4: PRYWATNE UŻYCIE (Private Use) ===
    const totalKm = periodKilometers.reduce((sum: number, km: any) => sum + (km.distance || 0), 0);
    const privateKm = periodKilometers.reduce((sum: number, km: any) => 
      sum + (km.is_private ? (km.distance || 0) : 0), 0
    );
    const privateUseVat = privateKm * 0.21; // €0.21 per km prywatnego użycia

    // === RUBRICA 5: VAT DO ODLICZENIA (Input VAT) ===
    let inputVat = 0;
    periodExpenses.forEach((exp: any) => {
      inputVat += exp.vat_amount || 0;
    });

    // === BILANS ===
    const totalVatPayable = vat21 + vat9 + privateUseVat;
    const totalVatDeductible = inputVat;
    const balance = totalVatPayable - totalVatDeductible;

    return {
      // Dane podstawowe
      year: selectedYear,
      period: selectedPeriod,
      startDate,
      endDate,
      
      // Przychody (Revenue)
      revenue21,
      revenue9,
      revenue0,
      reverseCharge,
      totalRevenue: revenue21 + revenue9 + revenue0 + reverseCharge,
      
      // VAT należny (Payable VAT)
      vat21,
      vat9,
      totalVatPayable,
      
      // Prywatne użycie
      totalKm,
      privateKm,
      privateUseVat,
      
      // VAT naliczony (Input VAT)
      inputVat,
      totalVatDeductible,
      
      // Bilans
      balance,
      balanceStatus: balance > 0 ? 'to_pay' : balance < 0 ? 'to_refund' : 'zero',
      
      // Szczegóły
      invoicesCount: periodInvoices.length,
      expensesCount: periodExpenses.length,
      kilometersCount: periodKilometers.length,
    };
  }, [selectedYear, selectedPeriod, invoices, expenses, kilometers]);

  // Sprawdź czy deklaracja już istnieje dla wybranego okresu
  const existingDeclaration = declarations.find(
    (d: any) => d.year === selectedYear && d.period === selectedPeriod
  );

  const loading = btwLoading || invoicesLoading || expensesLoading || kilometersLoading;

  // Zapisz deklarację
  const handleSaveDeclaration = async (status: 'draft' | 'submitted' = 'draft') => {
    if (!company) {
      toast.error(t('btw.errorNoCompany'));
      return;
    }

    const declarationData: Partial<BTWDeclaration> = {
      year: selectedYear,
      period: selectedPeriod,
      status,
      revenue_nl_high: calculatedBTW.revenue21,
      revenue_nl_low: calculatedBTW.revenue9,
      revenue_nl_zero: calculatedBTW.revenue0,
      revenue_nl_other: calculatedBTW.reverseCharge,
      vat_high: calculatedBTW.vat21,
      vat_low: calculatedBTW.vat9,
      private_use_amount: calculatedBTW.privateKm,
      private_use_vat: calculatedBTW.privateUseVat,
      input_vat_general: calculatedBTW.inputVat,
      total_vat_to_pay: calculatedBTW.totalVatPayable,
      total_vat_deductible: calculatedBTW.totalVatDeductible,
      balance: calculatedBTW.balance,
      notes: `Automatycznie wygenerowano na podstawie ${calculatedBTW.invoicesCount} faktur, ${calculatedBTW.expensesCount} wydatków i ${calculatedBTW.kilometersCount} przejazdów.`,
    };

    try {
      if (existingDeclaration) {
        await updateBTW(existingDeclaration.id, declarationData);
        toast.success(t('btw.declarationUpdated'));
      } else {
        await createBTW(declarationData);
        toast.success(t('btw.declarationSaved'));
      }
    } catch (error) {
      console.error('Error saving declaration:', error);
      toast.error(t('btw.errorSaving'));
    }
  };

  // Eksportuj do PDF
  const handleExportPDF = async () => {
    if (!company) {
      toast.error(t('btw.errorNoCompany'));
      return;
    }

    const declarationForPDF = existingDeclaration || {
      ...calculatedBTW,
      id: 'temp-' + Date.now(),
      company_id: company.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'draft' as const,
      revenue_nl_high: calculatedBTW.revenue21,
      revenue_nl_low: calculatedBTW.revenue9,
      revenue_nl_zero: calculatedBTW.revenue0,
      revenue_nl_other: calculatedBTW.reverseCharge,
      vat_high: calculatedBTW.vat21,
      vat_low: calculatedBTW.vat9,
      private_use_amount: calculatedBTW.privateKm,
      private_use_vat: calculatedBTW.privateUseVat,
      input_vat_general: calculatedBTW.inputVat,
      total_vat_to_pay: calculatedBTW.totalVatPayable,
      total_vat_deductible: calculatedBTW.totalVatDeductible,
      balance: calculatedBTW.balance,
      notes: '',
    };

    try {
      await generateBTWDeclarationPDF(declarationForPDF, company, t('language'));
      toast.success(t('btw.pdfExported'));
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error(t('btw.errorExportingPDF'));
    }
  };

  // Usuń deklarację
  const handleDelete = async (id: string) => {
    if (confirm(t('btw.confirmDelete'))) {
      try {
        await deleteBTW(id);
        toast.success(t('btw.declarationDeleted'));
      } catch (error) {
        console.error('Error deleting:', error);
        toast.error(t('btw.errorDeleting'));
      }
    }
  };

  // Formatuj walutę
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Formatuj datę
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nl-NL');
  };

  // Oblicz termin płatności (ostatni dzień miesiąca po kwartale)
  const getPaymentDeadline = () => {
    const quarterEndMonth = parseInt(selectedPeriod.substring(1)) * 3;
    const deadlineMonth = quarterEndMonth + 1;
    const deadlineYear = selectedYear;
    const lastDay = new Date(deadlineYear, deadlineMonth, 0).getDate();
    return new Date(deadlineYear, deadlineMonth - 1, lastDay);
  };

  const deadline = getPaymentDeadline();
  const daysUntilDeadline = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDeadline < 0;
  const isUrgent = daysUntilDeadline >= 0 && daysUntilDeadline <= 14;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Receipt size={36} className="text-blue-600" />
            BTW Aangifte
          </h1>
          <p className="text-gray-600 mt-1">
            {t('btw.subtitle')} - Automatische berekening en aangifte
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download size={20} />
            Export PDF
          </Button>
          <Button
            onClick={() => handleSaveDeclaration('draft')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText size={20} />
            {existingDeclaration ? 'Update' : 'Opslaan als concept'}
          </Button>
          <Button
            onClick={() => handleSaveDeclaration('submitted')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle size={20} />
            {existingDeclaration?.status === 'submitted' ? 'Ingediend' : 'Indienen'}
          </Button>
        </div>
      </div>

      {/* Selector okresu */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar size={32} className="text-blue-600" />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Periode selecteren</label>
              <div className="flex gap-3">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-semibold"
                >
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                
                <div className="flex gap-2">
                  {QUARTERS.map((quarter) => (
                    <button
                      key={quarter}
                      onClick={() => setSelectedPeriod(quarter)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        selectedPeriod === quarter
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {quarter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Deadline info */}
          <div className={`px-6 py-4 rounded-xl ${
            isOverdue ? 'bg-red-100 border-2 border-red-400' :
            isUrgent ? 'bg-orange-100 border-2 border-orange-400' :
            'bg-green-100 border-2 border-green-400'
          }`}>
            <div className="flex items-center gap-3">
              {isOverdue ? <Warning size={28} className="text-red-600" /> :
               isUrgent ? <Clock size={28} className="text-orange-600" /> :
               <CheckCircle size={28} className="text-green-600" />}
              <div>
                <p className="text-sm font-medium text-gray-700">Deadline</p>
                <p className={`text-lg font-bold ${
                  isOverdue ? 'text-red-700' :
                  isUrgent ? 'text-orange-700' :
                  'text-green-700'
                }`}>
                  {formatDate(deadline.toISOString())}
                </p>
                <p className="text-xs text-gray-600">
                  {isOverdue ? `${Math.abs(daysUntilDeadline)} dagen te laat!` :
                   `${daysUntilDeadline} dagen resterend`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Okres info */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>Geselecteerde periode:</strong> {QUARTER_DATES[selectedPeriod].label} 
            <span className="mx-2">•</span>
            {formatDate(calculatedBTW.startDate)} tot {formatDate(calculatedBTW.endDate)}
            <span className="mx-2">•</span>
            <strong>{calculatedBTW.invoicesCount}</strong> facturen, 
            <strong className="ml-1">{calculatedBTW.expensesCount}</strong> uitgaven,
            <strong className="ml-1">{calculatedBTW.kilometersCount}</strong> ritten
          </p>
        </div>
      </Card>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Przychody */}
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium">Omzet (Totaal)</p>
              <h3 className="text-3xl font-bold mt-1">{formatCurrency(calculatedBTW.totalRevenue)}</h3>
            </div>
            <TrendUp size={32} className="text-blue-200" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-100">21% BTW:</span>
              <span className="font-semibold">{formatCurrency(calculatedBTW.revenue21)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-100">9% BTW:</span>
              <span className="font-semibold">{formatCurrency(calculatedBTW.revenue9)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-100">0% BTW:</span>
              <span className="font-semibold">{formatCurrency(calculatedBTW.revenue0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-100">Reverse charge:</span>
              <span className="font-semibold">{formatCurrency(calculatedBTW.reverseCharge)}</span>
            </div>
          </div>
        </Card>

        {/* Card 2: VAT do zapłaty */}
        <Card className="p-6 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-red-100 text-sm font-medium">Te betalen BTW</p>
              <h3 className="text-3xl font-bold mt-1">{formatCurrency(calculatedBTW.totalVatPayable)}</h3>
            </div>
            <CurrencyEur size={32} className="text-red-200" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-100">BTW 21%:</span>
              <span className="font-semibold">{formatCurrency(calculatedBTW.vat21)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-100">BTW 9%:</span>
              <span className="font-semibold">{formatCurrency(calculatedBTW.vat9)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-100">Privégebruik:</span>
              <span className="font-semibold">{formatCurrency(calculatedBTW.privateUseVat)}</span>
            </div>
          </div>
        </Card>

        {/* Card 3: VAT do odliczenia */}
        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm font-medium">Aftrekbare BTW</p>
              <h3 className="text-3xl font-bold mt-1">{formatCurrency(calculatedBTW.totalVatDeductible)}</h3>
            </div>
            <Calculator size={32} className="text-green-200" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-100">Uit uitgaven:</span>
              <span className="font-semibold">{formatCurrency(calculatedBTW.inputVat)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-100">Aantal uitgaven:</span>
              <span className="font-semibold">{calculatedBTW.expensesCount}</span>
            </div>
          </div>
        </Card>

        {/* Card 4: Bilans */}
        <Card className={`p-6 text-white shadow-xl ${
          calculatedBTW.balanceStatus === 'to_pay' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
          calculatedBTW.balanceStatus === 'to_refund' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
          'bg-gradient-to-br from-gray-500 to-gray-600'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className={`text-sm font-medium ${
                calculatedBTW.balanceStatus === 'to_pay' ? 'text-orange-100' :
                calculatedBTW.balanceStatus === 'to_refund' ? 'text-purple-100' :
                'text-gray-100'
              }`}>
                {calculatedBTW.balanceStatus === 'to_pay' ? 'Te betalen' :
                 calculatedBTW.balanceStatus === 'to_refund' ? 'Terug te vorderen' :
                 'Saldo'}
              </p>
              <h3 className="text-3xl font-bold mt-1">
                {calculatedBTW.balanceStatus === 'to_refund' ? '-' : ''}
                {formatCurrency(Math.abs(calculatedBTW.balance))}
              </h3>
            </div>
            {calculatedBTW.balanceStatus === 'to_pay' ? <ArrowRight size={32} className="text-orange-200" /> :
             calculatedBTW.balanceStatus === 'to_refund' ? <ArrowRight size={32} className="text-purple-200 transform rotate-180" /> :
             <CheckCircle size={32} className="text-gray-200" />}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={
                calculatedBTW.balanceStatus === 'to_pay' ? 'text-orange-100' :
                calculatedBTW.balanceStatus === 'to_refund' ? 'text-purple-100' :
                'text-gray-100'
              }>Status:</span>
              <span className="font-semibold">
                {existingDeclaration?.status === 'submitted' ? '✓ Ingediend' :
                 existingDeclaration?.status === 'paid' ? '✓ Betaald' :
                 'Concept'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={
                calculatedBTW.balanceStatus === 'to_pay' ? 'text-orange-100' :
                calculatedBTW.balanceStatus === 'to_refund' ? 'text-purple-100' :
                'text-gray-100'
              }>Ritten (privé):</span>
              <span className="font-semibold">{calculatedBTW.privateKm} km</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Breakdown Table */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBar size={24} className="text-blue-600" />
          Gedetailleerde BTW berekening - Rubrieken
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-3 font-semibold text-gray-700 border">Rubriek</th>
                <th className="text-left p-3 font-semibold text-gray-700 border">Omschrijving</th>
                <th className="text-right p-3 font-semibold text-gray-700 border">Bedrag (netto)</th>
                <th className="text-right p-3 font-semibold text-gray-700 border">BTW</th>
              </tr>
            </thead>
            <tbody>
              {/* Omzet sectie */}
              <tr className="bg-blue-50">
                <td colSpan={4} className="p-3 font-bold text-blue-900 border">
                  PRESTATIES / OMZET
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 border font-mono">1a</td>
                <td className="p-3 border">Leveringen/diensten belast met hoog tarief (21%)</td>
                <td className="p-3 border text-right font-semibold">{formatCurrency(calculatedBTW.revenue21)}</td>
                <td className="p-3 border text-right font-semibold text-red-600">{formatCurrency(calculatedBTW.vat21)}</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 border font-mono">1b</td>
                <td className="p-3 border">Leveringen/diensten belast met laag tarief (9%)</td>
                <td className="p-3 border text-right font-semibold">{formatCurrency(calculatedBTW.revenue9)}</td>
                <td className="p-3 border text-right font-semibold text-red-600">{formatCurrency(calculatedBTW.vat9)}</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 border font-mono">1c</td>
                <td className="p-3 border">Leveringen/diensten belast met 0% of niet bij u belast</td>
                <td className="p-3 border text-right font-semibold">{formatCurrency(calculatedBTW.revenue0)}</td>
                <td className="p-3 border text-right font-semibold">€ 0,00</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 border font-mono">1d</td>
                <td className="p-3 border">Verlegd (reverse charge)</td>
                <td className="p-3 border text-right font-semibold">{formatCurrency(calculatedBTW.reverseCharge)}</td>
                <td className="p-3 border text-right font-semibold">€ 0,00</td>
              </tr>

              {/* Privégebruik */}
              <tr className="bg-orange-50">
                <td colSpan={4} className="p-3 font-bold text-orange-900 border">
                  PRIVÉGEBRUIK
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 border font-mono">4</td>
                <td className="p-3 border">
                  Privégebruik auto ({calculatedBTW.privateKm} km × €0.21)
                </td>
                <td className="p-3 border text-right font-semibold">{calculatedBTW.privateKm} km</td>
                <td className="p-3 border text-right font-semibold text-red-600">{formatCurrency(calculatedBTW.privateUseVat)}</td>
              </tr>

              {/* Voorbelasting */}
              <tr className="bg-green-50">
                <td colSpan={4} className="p-3 font-bold text-green-900 border">
                  VOORBELASTING (Aftrekbaar)
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3 border font-mono">5b</td>
                <td className="p-3 border">
                  Voorbelasting ({calculatedBTW.expensesCount} uitgaven)
                </td>
                <td className="p-3 border text-right font-semibold">-</td>
                <td className="p-3 border text-right font-semibold text-green-600">-{formatCurrency(calculatedBTW.inputVat)}</td>
              </tr>

              {/* Totalen */}
              <tr className="bg-gray-200 font-bold">
                <td colSpan={2} className="p-3 border text-gray-900">TOTAAL TE BETALEN BTW</td>
                <td className="p-3 border"></td>
                <td className="p-3 border text-right text-red-700 text-lg">{formatCurrency(calculatedBTW.totalVatPayable)}</td>
              </tr>
              <tr className="bg-gray-200 font-bold">
                <td colSpan={2} className="p-3 border text-gray-900">TOTAAL AFTREKBARE BTW</td>
                <td className="p-3 border"></td>
                <td className="p-3 border text-right text-green-700 text-lg">-{formatCurrency(calculatedBTW.totalVatDeductible)}</td>
              </tr>
              <tr className={`font-bold text-lg ${
                calculatedBTW.balanceStatus === 'to_pay' ? 'bg-orange-200' :
                calculatedBTW.balanceStatus === 'to_refund' ? 'bg-purple-200' :
                'bg-gray-300'
              }`}>
                <td colSpan={2} className="p-4 border text-gray-900">
                  SALDO {calculatedBTW.balanceStatus === 'to_pay' ? '(TE BETALEN)' :
                         calculatedBTW.balanceStatus === 'to_refund' ? '(TERUG TE VORDEREN)' :
                         ''}
                </td>
                <td className="p-4 border"></td>
                <td className={`p-4 border text-right text-xl ${
                  calculatedBTW.balanceStatus === 'to_pay' ? 'text-orange-700' :
                  calculatedBTW.balanceStatus === 'to_refund' ? 'text-purple-700' :
                  'text-gray-700'
                }`}>
                  {calculatedBTW.balanceStatus === 'to_refund' ? '-' : ''}
                  {formatCurrency(Math.abs(calculatedBTW.balance))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Historia deklaracji */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={24} className="text-blue-600" />
          Historische aangiften
        </h2>

        {declarations.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            Geen opgeslagen aangiften. Klik op "Opslaan als concept" om deze berekening op te slaan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-gray-700">Periode</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Omzet</th>
                  <th className="text-right p-3 font-semibold text-gray-700">BTW te betalen</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Aftrekbaar</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Saldo</th>
                  <th className="text-center p-3 font-semibold text-gray-700">Acties</th>
                </tr>
              </thead>
              <tbody>
                {declarations.map((decl: any) => {
                  const totalRevenue = (decl.revenue_nl_high || 0) + (decl.revenue_nl_low || 0) + 
                                      (decl.revenue_nl_zero || 0) + (decl.revenue_nl_other || 0);
                  
                  return (
                    <tr key={decl.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-semibold">{decl.period} {decl.year}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          decl.status === 'submitted' ? 'bg-green-100 text-green-700' :
                          decl.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {decl.status === 'submitted' ? 'Ingediend' :
                           decl.status === 'paid' ? 'Betaald' :
                           'Concept'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(totalRevenue)}</td>
                      <td className="p-3 text-right font-semibold text-red-600">
                        {formatCurrency(decl.total_vat_to_pay || 0)}
                      </td>
                      <td className="p-3 text-right font-semibold text-green-600">
                        {formatCurrency(decl.total_vat_deductible || 0)}
                      </td>
                      <td className="p-3 text-right font-bold">
                        {formatCurrency(decl.balance || 0)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={async () => {
                              try {
                                await generateBTWDeclarationPDF(decl, company!, t('language'));
                                toast.success('PDF geëxporteerd');
                              } catch (error) {
                                toast.error('Fout bij exporteren');
                              }
                            }}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Download size={16} />
                            PDF
                          </Button>
                          <Button
                            onClick={() => handleDelete(decl.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default BTWAangifte;
