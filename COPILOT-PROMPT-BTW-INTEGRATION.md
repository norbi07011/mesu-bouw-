# 🎯 KOMPLETNY PROMPT DO INTEGRACJI BTW AANGIFTE

## ⚠️ INSTRUKCJA DLA COPILOT - CZYTAJ UWAŻNIE!

Pobierz moduł BTW Aangifte z repozytorium **https://github.com/norbi07011/mesu-bouw-** (branch: main, commit: d939924) i zintegruj go z moją istniejącą aplikacją.

## 🚨 NAJWAŻNIEJSZE ZASADY - MUSISZ PRZESTRZEGAĆ:

### ❌ CZEGO NIE WOLNO CI ROBIĆ:
1. **NIE NADPISUJ** istniejących plików - tylko dodawaj/rozszerzaj kod
2. **NIE USUWAJ** żadnych istniejących funkcji, komponentów, hooków
3. **NIE ZMIENIAJ** struktury folderów mojej aplikacji
4. **NIE MODYFIKUJ** istniejących styli, jeśli nie są związane z BTW
5. **NIE PSUJ** działających już funkcjonalności (faktury, klienci, produkty, etc.)

### ✅ CO MUSISZ ZROBIĆ:
1. **DODAJ** nowe pliki BTW bez konfliktów
2. **ROZSZERZ** istniejące pliki o funkcje BTW (merge, nie replace)
3. **ZACHOWAJ** wszystkie istniejące importy, typy, funkcje
4. **DOPASUJ** nazwy, ścieżki, strukturę do mojej aplikacji
5. **ZINTEGRUJ** BTW z istniejącymi modułami (Invoices, Expenses, Kilometers)
6. **PRZETESTUJ** czy wszystko działa po integracji

---

## 📦 PLIKI DO POBRANIA Z REPO

### 1. NOWY GŁÓWNY KOMPONENT (skopiuj całość):
**Źródło:** `src/pages/BTWAangifte.tsx`
**Gdzie:** Skopiuj do mojego folderu `src/pages/` (lub odpowiadającego)
**Uwaga:** Jeśli struktura folderów się różni, dostosuj ścieżki importów!

### 2. DOKUMENTACJA (opcjonalnie):
- `BTW-SYSTEM-COMPLETE.md`
- `BTW-INTEGRATION-GUIDE.md`
- `QUICK-START.md`

---

## 🔧 PLIKI DO MODYFIKACJI (MERGE, NIE REPLACE!)

### A) `src/App.tsx` (lub główny plik routingu)

**CO DODAĆ:**

```typescript
// ========== DODAJ DO ISTNIEJĄCYCH IMPORTÓW ==========
import BTWAangifte from './pages/BTWAangifte';  // Dostosuj ścieżkę!
import { Receipt } from '@phosphor-icons/react'; // Lub inna biblioteka ikon

// ========== ROZSZERZ TYP PAGE (nie usuwaj istniejących!) ==========
type Page = 'dashboard' | 'invoices' | 'invoices-new' | 'clients' | 'products' | 
            'kilometers' | 'expenses' | 'btw' | 'reports' | 'settings';
// Dodaj 'btw' do swojej listy, zachowaj resztę!

// ========== DODAJ DO navItems (nie usuwaj istniejących!) ==========
const navItems = [
  // ... twoje istniejące items
  { id: 'kilometers' as Page, icon: Car, label: t('nav.kilometers') },
  { id: 'btw' as Page, icon: Receipt, label: t('nav.btw') },  // ← DODAJ TO
  { id: 'reports' as Page, icon: ChartBar, label: t('nav.reports') },
  // ... reszta items
];

// ========== DODAJ CASE DO renderPage() (nie usuwaj istniejących!) ==========
const renderPage = () => {
  switch (currentPage) {
    // ... twoje istniejące cases
    case 'kilometers':
      return <Kilometers />;
    case 'btw':
      return <BTWAangifte />;  // ← DODAJ TO
    case 'reports':
      return <Reports />;
    // ... reszta cases
  }
};
```

**⚠️ UWAGA:** Jeśli używasz React Router zamiast switch/case, dodaj route:
```typescript
<Route path="/btw" element={<BTWAangifte />} />
```

---

### B) `src/hooks/useElectronDB.ts` (lub plik z hookami/store)

**DODAJ 3 NOWE HOOKI** (na końcu pliku, NIE NADPISUJ istniejących!):

```typescript
// ========== HOOK 1: useBTW() ==========
export function useBTW() {
  const [declarations, setDeclarations] = useState<BTWDeclaration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeclarations();
  }, []);

  const loadDeclarations = async () => {
    setLoading(true);
    try {
      if (window.electronAPI?.database?.getBTW) {
        const data = await window.electronAPI.database.getBTW();
        setDeclarations(data);
      } else {
        // Fallback do localStorage
        const stored = localStorage.getItem('btw_declarations');
        setDeclarations(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error loading BTW:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBTW = async (data: Partial<BTWDeclaration>) => {
    const newDeclaration: BTWDeclaration = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as BTWDeclaration;

    if (window.electronAPI?.database?.createBTW) {
      await window.electronAPI.database.createBTW(newDeclaration);
    } else {
      const all = [...declarations, newDeclaration];
      localStorage.setItem('btw_declarations', JSON.stringify(all));
      setDeclarations(all);
    }
    await loadDeclarations();
  };

  const updateBTW = async (id: string, data: Partial<BTWDeclaration>) => {
    if (window.electronAPI?.database?.updateBTW) {
      await window.electronAPI.database.updateBTW(id, data);
    } else {
      const all = declarations.map(d => 
        d.id === id ? { ...d, ...data, updated_at: new Date().toISOString() } : d
      );
      localStorage.setItem('btw_declarations', JSON.stringify(all));
      setDeclarations(all);
    }
    await loadDeclarations();
  };

  const deleteBTW = async (id: string) => {
    if (window.electronAPI?.database?.deleteBTW) {
      await window.electronAPI.database.deleteBTW(id);
    } else {
      const all = declarations.filter(d => d.id !== id);
      localStorage.setItem('btw_declarations', JSON.stringify(all));
      setDeclarations(all);
    }
    await loadDeclarations();
  };

  return { declarations, loading, createBTW, updateBTW, deleteBTW, refetch: loadDeclarations };
}

// ========== HOOK 2: useExpenses() ==========
export function useExpenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      if (window.electronAPI?.database?.getExpenses) {
        const data = await window.electronAPI.database.getExpenses();
        setExpenses(data);
      } else {
        const stored = localStorage.getItem('expenses');
        setExpenses(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (data: any) => {
    const newExpense = { id: Date.now().toString(), ...data, created_at: new Date().toISOString() };
    if (window.electronAPI?.database?.createExpense) {
      await window.electronAPI.database.createExpense(newExpense);
    } else {
      const all = [...expenses, newExpense];
      localStorage.setItem('expenses', JSON.stringify(all));
      setExpenses(all);
    }
    await loadExpenses();
  };

  const updateExpense = async (id: string, data: any) => {
    if (window.electronAPI?.database?.updateExpense) {
      await window.electronAPI.database.updateExpense(id, data);
    } else {
      const all = expenses.map(e => e.id === id ? { ...e, ...data } : e);
      localStorage.setItem('expenses', JSON.stringify(all));
      setExpenses(all);
    }
    await loadExpenses();
  };

  const deleteExpense = async (id: string) => {
    if (window.electronAPI?.database?.deleteExpense) {
      await window.electronAPI.database.deleteExpense(id);
    } else {
      const all = expenses.filter(e => e.id !== id);
      localStorage.setItem('expenses', JSON.stringify(all));
      setExpenses(all);
    }
    await loadExpenses();
  };

  return { expenses, loading, createExpense, updateExpense, deleteExpense, refetch: loadExpenses };
}

// ========== HOOK 3: useKilometers() ==========
export function useKilometers() {
  const [kilometers, setKilometers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKilometers();
  }, []);

  const loadKilometers = async () => {
    setLoading(true);
    try {
      if (window.electronAPI?.database?.getKilometers) {
        const data = await window.electronAPI.database.getKilometers();
        setKilometers(data);
      } else {
        const stored = localStorage.getItem('kilometers');
        setKilometers(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error loading kilometers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createKilometer = async (data: any) => {
    const newKm = { id: Date.now().toString(), ...data, created_at: new Date().toISOString() };
    if (window.electronAPI?.database?.createKilometer) {
      await window.electronAPI.database.createKilometer(newKm);
    } else {
      const all = [...kilometers, newKm];
      localStorage.setItem('kilometers', JSON.stringify(all));
      setKilometers(all);
    }
    await loadKilometers();
  };

  const updateKilometer = async (id: string, data: any) => {
    if (window.electronAPI?.database?.updateKilometer) {
      await window.electronAPI.database.updateKilometer(id, data);
    } else {
      const all = kilometers.map(k => k.id === id ? { ...k, ...data } : k);
      localStorage.setItem('kilometers', JSON.stringify(all));
      setKilometers(all);
    }
    await loadKilometers();
  };

  const deleteKilometer = async (id: string) => {
    if (window.electronAPI?.database?.deleteKilometer) {
      await window.electronAPI.database.deleteKilometer(id);
    } else {
      const all = kilometers.filter(k => k.id !== id);
      localStorage.setItem('kilometers', JSON.stringify(all));
      setKilometers(all);
    }
    await loadKilometers();
  };

  return { kilometers, loading, createKilometer, updateKilometer, deleteKilometer, refetch: loadKilometers };
}
```

**⚠️ UWAGA:** Dostosuj do mojej struktury state management (Redux/Zustand/Context)!

---

### C) `src/lib/pdf-generator.ts` (lub plik z PDF utilities)

**DODAJ NA KOŃCU PLIKU:**

```typescript
// ========== FUNKCJA GENEROWANIA PDF BTW ==========
export async function generateBTWDeclarationPDF(
  declaration: any,
  company: Company,
  language: string = 'nl'
): Promise<void> {
  try {
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule;
    await import('jspdf-autotable');

    const doc = new (jsPDF as any)('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('BTW AANGIFTE', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`${declaration.period} ${declaration.year}`, pageWidth / 2, 30, { align: 'center' });

    // Company info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(company.name, 20, 50);
    doc.text(`BTW-nummer: ${company.vat_number || 'N/A'}`, 20, 56);
    doc.text(`KVK: ${company.kvk_number || 'N/A'}`, 20, 62);

    let yPos = 75;

    // Tabela rubryk
    (doc as any).autoTable({
      startY: yPos,
      head: [['Rubriek', 'Omschrijving', 'Bedrag (netto)', 'BTW']],
      body: [
        ['1a', 'Leveringen/diensten 21%', 
         `€ ${(declaration.revenue_nl_high || 0).toFixed(2)}`,
         `€ ${(declaration.vat_high || 0).toFixed(2)}`],
        ['1b', 'Leveringen/diensten 9%',
         `€ ${(declaration.revenue_nl_low || 0).toFixed(2)}`,
         `€ ${(declaration.vat_low || 0).toFixed(2)}`],
        ['1c', 'Leveringen/diensten 0%',
         `€ ${(declaration.revenue_nl_zero || 0).toFixed(2)}`,
         '€ 0,00'],
        ['1d', 'Verlegd (reverse charge)',
         `€ ${(declaration.revenue_nl_other || 0).toFixed(2)}`,
         '€ 0,00'],
        ['4', 'Privégebruik',
         `${declaration.private_use_amount || 0} km`,
         `€ ${(declaration.private_use_vat || 0).toFixed(2)}`],
        ['5b', 'Voorbelasting (aftrekbaar)',
         '-',
         `€ -${(declaration.input_vat_general || 0).toFixed(2)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Podsumowanie
    doc.setFillColor(255, 237, 213);
    doc.rect(20, yPos, pageWidth - 40, 35, 'F');
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('SALDO:', 25, yPos + 10);
    doc.setFontSize(16);
    const balance = declaration.balance || 0;
    const balanceColor = balance > 0 ? [255, 0, 0] : balance < 0 ? [0, 128, 0] : [0, 0, 0];
    doc.setTextColor(...balanceColor);
    doc.text(`€ ${Math.abs(balance).toFixed(2)} ${balance > 0 ? 'TE BETALEN' : 'TERUG TE VORDEREN'}`,
             pageWidth - 25, yPos + 10, { align: 'right' });

    // Footer
    yPos = doc.internal.pageSize.height - 30;
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(9);
    doc.text(`Gegenereerd op: ${new Date().toLocaleDateString('nl-NL')}`, pageWidth / 2, yPos, { align: 'center' });
    doc.text(`Status: ${declaration.status === 'submitted' ? 'Ingediend' : 'Concept'}`, pageWidth / 2, yPos + 5, { align: 'center' });

    // Zapisz
    doc.save(`BTW-Aangifte-${declaration.period}-${declaration.year}.pdf`);
  } catch (error) {
    console.error('Error generating BTW PDF:', error);
    throw error;
  }
}
```

---

### D) `src/types/btw.ts` (lub plik z typami)

**DODAJ/ROZSZERZ INTERFEJS:**

```typescript
export interface BTWDeclaration {
  id: string;
  company_id: string;
  year: number;
  period: BTWPeriod;
  status: 'draft' | 'submitted' | 'paid';
  
  // Przychody (Revenue)
  revenue_nl_high: number;      // 1a - 21%
  revenue_nl_low: number;        // 1b - 9%
  revenue_nl_zero: number;       // 1c - 0%
  revenue_nl_other: number;      // 1d - reverse charge
  
  // VAT należny
  vat_high: number;
  vat_low: number;
  
  // Prywatne użycie
  private_use_amount: number;    // km
  private_use_vat: number;
  
  // EU
  eu_services?: number;
  eu_acquisitions?: number;
  eu_acquisitions_vat?: number;
  
  // VAT naliczony
  input_vat_general: number;     // 5b
  
  // Podsumowanie
  total_vat_to_pay: number;
  total_vat_deductible: number;
  balance: number;
  
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type BTWPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface BTWCalculationData {
  year: number;
  period: BTWPeriod;
  startDate: string;
  endDate: string;
  revenue21: number;
  revenue9: number;
  revenue0: number;
  reverseCharge: number;
  totalRevenue: number;
  vat21: number;
  vat9: number;
  totalVatPayable: number;
  totalKm?: number;
  privateKm?: number;
  privateUseVat?: number;
  inputVat: number;
  totalVatDeductible: number;
  balance: number;
  balanceStatus: 'to_pay' | 'to_refund' | 'zero';
  invoicesCount: number;
  expensesCount: number;
  kilometersCount?: number;
}
```

---

### E) `src/types/electron.d.ts` (jeśli używasz Electron)

**DODAJ DO INTERFEJSU:**

```typescript
interface ElectronAPI {
  database: {
    // ... istniejące metody
    
    // BTW metody
    getBTW: () => Promise<BTWDeclaration[]>;
    createBTW: (data: BTWDeclaration) => Promise<void>;
    updateBTW: (id: string, data: Partial<BTWDeclaration>) => Promise<void>;
    deleteBTW: (id: string) => Promise<void>;
    
    // Expenses metody (jeśli jeszcze nie ma)
    getExpenses?: () => Promise<any[]>;
    createExpense?: (data: any) => Promise<void>;
    updateExpense?: (id: string, data: any) => Promise<void>;
    deleteExpense?: (id: string) => Promise<void>;
    
    // Kilometers metody (jeśli jeszcze nie ma)
    getKilometers?: () => Promise<any[]>;
    createKilometer?: (data: any) => Promise<void>;
    updateKilometer?: (id: string, data: any) => Promise<void>;
    deleteKilometer?: (id: string) => Promise<void>;
  };
}
```

---

### F) `src/i18n/pl.ts` (tłumaczenia polskie)

**DODAJ DO OBIEKTU:**

```typescript
export default {
  translation: {
    nav: {
      // ... istniejące
      btw: 'BTW Aangifte',  // ← DODAJ
    },
    
    // ... inne sekcje
    
    btw: {  // ← DODAJ CAŁĄ SEKCJĘ
      title: 'Deklaracja BTW',
      subtitle: 'Kwartalne deklaracje BTW dla ZZP',
      declarationSaved: 'Deklaracja zapisana',
      declarationUpdated: 'Deklaracja zaktualizowana',
      declarationDeleted: 'Deklaracja usunięta',
      errorSaving: 'Błąd podczas zapisywania',
      errorDeleting: 'Błąd podczas usuwania',
      errorNoCompany: 'Brak danych firmy. Uzupełnij w ustawieniach.',
      pdfExported: 'PDF wyeksportowany',
      errorExportingPDF: 'Błąd eksportu PDF',
      confirmDelete: 'Czy na pewno usunąć deklarację?',
      // ... dodaj więcej kluczy z repo
    },
  },
};
```

### G) `src/i18n/nl.ts` (tłumaczenia holenderskie)

```typescript
nav: {
  btw: 'BTW Aangifte',
},
btw: {
  title: 'BTW Aangifte',
  subtitle: 'Kwartaal BTW aangiften voor ZZP',
  declarationSaved: 'Aangifte opgeslagen',
  declarationUpdated: 'Aangifte bijgewerkt',
  declarationDeleted: 'Aangifte verwijderd',
  // ... więcej
},
```

### H) `src/i18n/en.ts` (tłumaczenia angielskie)

```typescript
nav: {
  btw: 'VAT Declaration',
},
btw: {
  title: 'VAT Declaration',
  subtitle: 'Quarterly VAT declarations for freelancers',
  declarationSaved: 'Declaration saved',
  // ... więcej
},
```

---

### I) `package.json`

**DODAJ DO dependencies:**

```json
{
  "dependencies": {
    // ... istniejące pakiety
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.3"
  }
}
```

**PO EDYCJI URUCHOM:** `npm install`

---

## 🎯 JAK DZIAŁA BTW AANGIFTE (FUNKCJONALNOŚĆ)

### 1. AUTOMATYCZNE POBIERANIE DANYCH:
BTW Aangifte automatycznie pobiera dane z WSZYSTKICH modułów:

```
┌─────────────────┐
│ BTWAangifte.tsx │
└────────┬────────┘
         │
         ├─→ useInvoices() ──→ Wszystkie faktury z okresu
         │                     ├─ Wykrywa stawki VAT (21%, 9%, 0%)
         │                     ├─ Wykrywa reverse charge
         │                     └─ Sumuje przychody i VAT należny
         │
         ├─→ useExpenses() ──→ Wszystkie wydatki z okresu
         │                     └─ Sumuje VAT naliczony do odliczenia
         │
         ├─→ useKilometers() ─→ Wszystkie przejazdy z okresu
         │                     ├─ Liczy całkowite km
         │                     ├─ Liczy prywatne km
         │                     └─ Oblicza VAT z prywatnego użycia (€0.21/km)
         │
         └─→ useCompany() ────→ Dane firmy do PDF
```

### 2. AUTOMATYCZNE OBLICZENIA:

```javascript
// Przykład kalkulacji w BTWAangifte.tsx (już wbudowane w komponent)
const calculatedBTW = useMemo(() => {
  // 1. Filtruj dane dla wybranego kwartału
  const periodInvoices = invoices.filter(inv => 
    inv.date >= startDate && inv.date <= endDate
  );
  
  // 2. Oblicz przychody i VAT należny
  let revenue21 = 0, revenue9 = 0, revenue0 = 0;
  periodInvoices.forEach(inv => {
    if (inv.vat_rate === 21) revenue21 += inv.total_net;
    else if (inv.vat_rate === 9) revenue9 += inv.total_net;
    else revenue0 += inv.total_net;
  });
  
  // 3. Oblicz VAT do odliczenia z wydatków
  const inputVat = periodExpenses.reduce((sum, exp) => sum + exp.vat_amount, 0);
  
  // 4. Oblicz prywatne użycie
  const privateKm = periodKilometers
    .filter(km => km.is_private)
    .reduce((sum, km) => sum + km.distance, 0);
  const privateUseVat = privateKm * 0.21;
  
  // 5. BILANS KOŃCOWY
  const totalVatPayable = (revenue21 * 0.21) + (revenue9 * 0.09) + privateUseVat;
  const balance = totalVatPayable - inputVat;
  
  return { revenue21, revenue9, vat21, vat9, inputVat, balance, ... };
}, [selectedYear, selectedPeriod, invoices, expenses, kilometers]);
```

### 3. DASHBOARD Z 4 KARTAMI:

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  💰 PRZYCHODY    │ │  ❌ VAT NALEŻNY  │ │  ✅ VAT ODLICZ.  │ │  💳 SALDO        │
│  (niebieska)     │ │  (czerwona)      │ │  (zielona)       │ │  (pomarańczowa)  │
├──────────────────┤ ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ Suma: €50,000    │ │ VAT 21%: €8,400  │ │ Z wydatków:      │ │ Do zapłaty:      │
│ • 21%: €40,000   │ │ VAT 9%: €900     │ │ €2,500           │ │ €7,130           │
│ • 9%: €10,000    │ │ Prywatne: €230   │ │                  │ │                  │
│ • 0%: €0         │ │ Suma: €9,530     │ │ Wydatki: 45      │ │ Status: Draft    │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 4. SZCZEGÓŁOWA TABELA RUBRYK:

```
╔════════╦═══════════════════════════════════╦══════════════╦══════════════╗
║ Rubr.  ║ Opis                              ║ Netto        ║ VAT          ║
╠════════╬═══════════════════════════════════╬══════════════╬══════════════╣
║ 1a     ║ Leveringen/diensten 21%           ║ €40,000.00   ║ €8,400.00    ║
║ 1b     ║ Leveringen/diensten 9%            ║ €10,000.00   ║ €900.00      ║
║ 1c     ║ Leveringen/diensten 0%            ║ €0.00        ║ €0.00        ║
║ 1d     ║ Verlegd (reverse charge)          ║ €0.00        ║ €0.00        ║
║ 4      ║ Privégebruik auto (1,100 km)      ║ 1,100 km     ║ €231.00      ║
║ 5b     ║ Voorbelasting (aftrekbaar)        ║ -            ║ -€2,400.00   ║
╠════════╩═══════════════════════════════════╬══════════════╬══════════════╣
║ TOTAAL TE BETALEN                          ║              ║ €9,531.00    ║
║ TOTAAL AFTREKBAAR                          ║              ║ -€2,400.00   ║
║ 💰 SALDO (TE BETALEN)                      ║              ║ €7,131.00    ║
╚════════════════════════════════════════════╩══════════════╩══════════════╝
```

### 5. EKSPORT PDF - CO ZAWIERA:

Gdy użytkownik kliknie "Export PDF", tworzy się profesjonalny dokument zawierający:

```
📄 BTW-Aangifte-Q1-2025.pdf
├─ Header: Logo firmy, nazwa, okres
├─ Dane firmy: Nazwa, BTW-nummer, KVK
├─ Tabela wszystkich rubryk (1a-5b)
├─ Podsumowanie finansowe:
│  ├─ Wszystkie przychody z podziałem na stawki
│  ├─ Wszystkie wydatki z VAT
│  ├─ Wszystkie prywatne km
│  ├─ Szczegółowe obliczenia VAT
│  └─ Końcowy bilans (do zapłaty/zwrot)
├─ Lista faktur z okresu (opcjonalnie)
├─ Lista wydatków z okresu (opcjonalnie)
├─ Lista przejazdów z okresu (opcjonalnie)
└─ Stopka: Data wygenerowania, status
```

**KSIĘGOWY DOSTAJE KOMPLETNY DOKUMENT Z:**
✅ Wszystkimi przychodami
✅ Wszystkimi kosztami
✅ Wszystkimi kilometrami
✅ Obliczonym VAT do zapłaty
✅ Gotowym do złożenia w urzędzie
✅ Możliwością archiwizacji (PDF zapisany lokalnie)

### 6. HISTORIA DEKLARACJI:

```
╔═════════╦══════════╦════════════╦═══════════╦═════════════╦═══════════╗
║ Okres   ║ Status   ║ Przychód   ║ VAT płac. ║ VAT odlicz. ║ Saldo     ║
╠═════════╬══════════╬════════════╬═══════════╬═════════════╬═══════════╣
║ Q4 2024 ║ Betaald  ║ €65,000    ║ €11,200   ║ €3,100      ║ €8,100    ║
║ Q3 2024 ║ Ingedi.  ║ €52,000    ║ €9,100    ║ €2,800      ║ €6,300    ║
║ Q2 2024 ║ Concept  ║ €48,000    ║ €8,500    ║ €2,600      ║ €5,900    ║
║ Q1 2024 ║ Concept  ║ €50,000    ║ €9,531    ║ €2,400      ║ €7,131    ║
╚═════════╩══════════╩════════════╩═══════════╩═════════════╩═══════════╝
```

Każda deklaracja ma przycisk PDF - możesz wyeksportować każdą deklarację w dowolnym momencie.

---

## 🔄 INTEGRACJA KROK PO KROKU

### KROK 1: Sklonuj repo i zobacz zmiany
```bash
git clone https://github.com/norbi07011/mesu-bouw-.git btw-source
cd btw-source
git show d939924:src/pages/BTWAangifte.tsx > ~/Desktop/BTWAangifte.txt
```

### KROK 2: Skopiuj główny plik
```bash
# Skopiuj BTWAangifte.tsx do swojego projektu
# Dostosuj importy do swojej struktury folderów
```

### KROK 3: Dodaj hooki (useElectronDB.ts)
```bash
# Dopisz na końcu pliku 3 nowe hooki
# NIE NADPISUJ istniejącego kodu!
```

### KROK 4: Dodaj routing (App.tsx)
```bash
# Dodaj import, case, navItem
# ZACHOWAJ wszystkie istniejące routes!
```

### KROK 5: Dodaj typy (types/)
```bash
# Rozszerz istniejące interfejsy
# Dodaj nowe typy BTW
```

### KROK 6: Dodaj tłumaczenia (i18n/)
```bash
# Dodaj nav.btw we wszystkich językach
# Dodaj sekcję btw z kluczami
```

### KROK 7: Zainstaluj pakiety
```bash
npm install jspdf jspdf-autotable
```

### KROK 8: Testuj!
```bash
npm run dev
# Sprawdź czy menu BTW się pokazuje
# Sprawdź czy dane się pobierają
# Sprawdź kalkulacje
# Przetestuj PDF export
```

---

## ✅ CHECKLIST WERYFIKACJI

Po integracji sprawdź:

- [ ] Menu pokazuje przycisk "BTW Aangifte" z ikoną
- [ ] Kliknięcie w BTW otwiera stronę (nie błąd 404)
- [ ] Strona się ładuje bez błędów konsoli
- [ ] 4 karty wyświetlają dane (nawet jeśli 0)
- [ ] Selektor roku i kwartału działa
- [ ] Dane z faktur się pobierają automatycznie
- [ ] Dane z wydatków się pobierają automatycznie
- [ ] Dane z kilometrów się pobierają automatycznie
- [ ] Kalkulacje się przeliczają przy zmianie okresu
- [ ] Tabela rubryk pokazuje poprawne wartości
- [ ] Przycisk "Opslaan" zapisuje deklarację
- [ ] Przycisk "Export PDF" generuje plik
- [ ] PDF zawiera wszystkie dane
- [ ] Historia deklaracji wyświetla zapisane
- [ ] Usuwanie deklaracji działa
- [ ] Tłumaczenia działają (PL, NL, EN)
- [ ] Deadline pokazuje poprawne ostrzeżenia
- [ ] Wszystkie STARE funkcje nadal działają!

---

## 🚨 NAJCZĘSTSZE PROBLEMY I ROZWIĄZANIA

### ❌ Problem: "Cannot find module 'BTWAangifte'"
✅ Rozwiązanie: Sprawdź ścieżkę importu - dostosuj do swojej struktury folderów

### ❌ Problem: "Cannot find module 'jspdf'"
✅ Rozwiązanie: `npm install jspdf jspdf-autotable`

### ❌ Problem: "Missing translation key 'btw.title'"
✅ Rozwiązanie: Dodaj sekcję `btw: {}` w i18n/pl.ts, nl.ts, en.ts

### ❌ Problem: "useInvoices is not defined"
✅ Rozwiązanie: Sprawdź czy już masz hook useInvoices - jeśli nie, stwórz go podobnie jak useBTW

### ❌ Problem: Kalkulacje pokazują 0
✅ Rozwiązanie: Sprawdź format dat w fakturach (musi być YYYY-MM-DD)

### ❌ Problem: PDF się nie generuje
✅ Rozwiązanie: Sprawdź konsolę, upewnij się że jspdf jest zainstalowany

---

## 📊 STRUKTURA DANYCH (KOMPATYBILNOŚĆ)

BTW Aangifte oczekuje takich struktur danych:

### FAKTURY (Invoices):
```typescript
{
  id: string;
  issue_date: string;  // Format: "2025-01-15"
  total_net: number;
  total_vat: number;
  vat_note?: string;   // "reverse charge" wykrywa odwrotne obciążenie
  status: 'paid' | 'unpaid' | 'cancelled';
}
```

### WYDATKI (Expenses):
```typescript
{
  id: string;
  date: string;        // Format: "2025-01-15"
  vat_amount: number;
  amount: number;
}
```

### KILOMETRY (Kilometers):
```typescript
{
  id: string;
  date: string;        // Format: "2025-01-15"
  distance: number;
  is_private: boolean;
}
```

**⚠️ JEŚLI TWOJA STRUKTURA JEST INNA:**
Dostosuj kalkulacje w BTWAangifte.tsx w sekcji `calculatedBTW = useMemo(...)`

---

## 🎯 PODSUMOWANIE

1. **POBIERZ** pliki z repo (BTWAangifte.tsx + dokumenty)
2. **DODAJ** hooki do useElectronDB.ts (NIE NADPISUJ!)
3. **ROZSZERZ** App.tsx o routing BTW (ZACHOWAJ stare routes!)
4. **DODAJ** typy BTW do types/
5. **DODAJ** tłumaczenia do i18n/
6. **ZAINSTALUJ** jspdf i jspdf-autotable
7. **DOSTOSUJ** importy i ścieżki do swojej struktury
8. **PRZETESTUJ** czy wszystko działa
9. **NIE PSU**J istniejących funkcji!

**Jeśli coś nie działa - PYTAJ zamiast zgadywać!**

**Repo:** https://github.com/norbi07011/mesu-bouw-
**Commit:** d939924
**Dokumentacja:** BTW-INTEGRATION-GUIDE.md

---

🎉 **POWODZENIA Z INTEGRACJĄ!**
