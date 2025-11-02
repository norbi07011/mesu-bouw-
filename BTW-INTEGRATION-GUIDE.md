# BTW Aangifte - Przewodnik Integracji

## 📋 Instrukcja dla drugiego komputera

### Opcja 1: Automatyczna integracja przez GitHub Copilot

Użyj tego promptu w Copilot Chat:

```
Pobierz najnowsze zmiany z repozytorium norbi07011/mesu-bouw- (branch: main) 
i zintegruj moduł BTW Aangifte z moją aplikacją.

PLIKI DO POBRANIA I ZINTEGROWANIA:

1. NOWE PLIKI (skopiuj całkowicie):
   - src/pages/BTWAangifte.tsx
   - BTW-SYSTEM-COMPLETE.md
   - QUICK-START.md

2. ZMODYFIKOWANE PLIKI (merge zmiany):
   
   a) src/App.tsx:
      - Dodaj import: import BTWAangifte from './pages/BTWAangifte';
      - Dodaj typ: type Page = ... | 'btw' | ...
      - Dodaj import ikony: import { Receipt } from '@phosphor-icons/react';
      - Dodaj do navItems: { id: 'btw', icon: Receipt, label: t('nav.btw') }
      - Dodaj case do renderPage(): case 'btw': return <BTWAangifte />;
   
   b) src/hooks/useElectronDB.ts:
      - Dodaj 3 nowe hooki: useBTW(), useExpenses(), useKilometers()
      - Każdy ~100-120 linii kodu z pełnym CRUD
   
   c) src/lib/pdf-generator.ts:
      - Dodaj funkcję generateBTWDeclarationPDF() (~230 linii)
      - Dodaj import jspdf dynamicznie
   
   d) src/types/btw.ts:
      - Rozszerz BTWCalculationData o pole kilometers?: { total, privateUse, privateUseVat }
   
   e) src/types/index.ts:
      - Dodaj eksporty typów BTW jeśli brakuje
   
   f) src/types/electron.d.ts:
      - Dodaj metody: getBTW, createBTW, updateBTW, deleteBTW w ElectronAPI
   
   g) src/i18n/pl.ts:
      - Dodaj nav.btw: 'BTW Aangifte'
      - Dodaj pełną sekcję btw: { } z 60+ kluczami (title, subtitle, declarationSaved, etc.)
   
   h) src/i18n/nl.ts:
      - Dodaj nav.btw: 'BTW Aangifte'
      - Dodaj pełną sekcję btw: { } z 60+ kluczami holenderskimi
   
   i) src/i18n/en.ts:
      - Dodaj nav.btw: 'VAT Declaration'
      - Dodaj pełną sekcję btw: { } z 60+ kluczami angielskimi
   
   j) package.json:
      - Dodaj dependencies: "jspdf": "^2.5.2", "jspdf-autotable": "^3.8.3"

3. FUNKCJONALNOŚĆ:
   - Automatyczne obliczenia BTW z faktur, wydatków, kilometrów
   - Dashboard z 4 kolorowymi kartami (omzet, VAT należny, VAT naliczony, saldo)
   - Selektor roku i kwartału (Q1-Q4)
   - Monitoring deadline z ostrzeżeniami (czerwony/pomarańczowy/zielony)
   - Szczegółowa tabela holenderskich rubryk BTW (1a, 1b, 1c, 1d, 4, 5b)
   - Zapis deklaracji jako draft lub submitted
   - Historia wszystkich deklaracji
   - Eksport każdej deklaracji do PDF
   - Obsługa stawek: 21%, 9%, 0%, reverse charge
   - Automatyczne obliczanie prywatnego użycia auta (€0.21/km)

Po integracji uruchom: npm install (zainstaluje jspdf)
```

---

### Opcja 2: Ręczna integracja przez Git

```bash
# 1. Sklonuj/zaktualizuj repo
git clone https://github.com/norbi07011/mesu-bouw-.git
cd mesu-bouw-
git pull origin main

# 2. Zobacz ostatni commit z BTW
git log -1 --stat

# 3. Zobacz szczegółowe zmiany w plikach
git show HEAD:src/pages/BTWAangifte.tsx > BTWAangifte.txt
git diff HEAD~1 src/App.tsx
git diff HEAD~1 src/hooks/useElectronDB.ts
git diff HEAD~1 src/lib/pdf-generator.ts
git diff HEAD~1 src/i18n/pl.ts
git diff HEAD~1 src/i18n/nl.ts
git diff HEAD~1 src/i18n/en.ts
git diff HEAD~1 src/types/btw.ts
git diff HEAD~1 package.json

# 4. Skopiuj pliki do swojej aplikacji
# (dostosuj ścieżki do swojego projektu)
```

---

### Opcja 3: Pobranie tylko plików BTW

Na drugim komputerze w terminalu:

```bash
# Pobierz plik BTWAangifte.tsx
curl -o BTWAangifte.tsx https://raw.githubusercontent.com/norbi07011/mesu-bouw-/main/src/pages/BTWAangifte.tsx

# Pobierz dokumentację
curl -o BTW-SYSTEM-COMPLETE.md https://raw.githubusercontent.com/norbi07011/mesu-bouw-/main/BTW-SYSTEM-COMPLETE.md
curl -o QUICK-START.md https://raw.githubusercontent.com/norbi07011/mesu-bouw-/main/QUICK-START.md

# Zobacz zmiany w pozostałych plikach na GitHubie:
# https://github.com/norbi07011/mesu-bouw-/commit/d939924
```

---

## 📦 Lista wszystkich zmienionych plików (17 plików):

### Nowe pliki (4):
1. ✅ `src/pages/BTWAangifte.tsx` - główna strona BTW (680 linii)
2. ✅ `BTW-SYSTEM-COMPLETE.md` - dokumentacja systemu
3. ✅ `QUICK-START.md` - quick start
4. ⚠️ `src/pages/BTWAangifte-OLD-BACKUP.tsx` - backup (opcjonalny)

### Zmodyfikowane pliki (13):
1. ✅ `src/App.tsx` - dodano BTW do menu i routingu
2. ✅ `src/hooks/useElectronDB.ts` - dodano 3 hooki (+310 linii)
3. ✅ `src/lib/pdf-generator.ts` - dodano generateBTWDeclarationPDF() (+230 linii)
4. ✅ `src/types/btw.ts` - rozszerzono interfejs
5. ✅ `src/types/index.ts` - dodano eksporty
6. ✅ `src/types/electron.d.ts` - dodano metody BTW
7. ✅ `src/i18n/pl.ts` - dodano nav.btw + sekcja btw
8. ✅ `src/i18n/nl.ts` - dodano nav.btw + sekcja btw
9. ✅ `src/i18n/en.ts` - dodano nav.btw + sekcja btw
10. ✅ `package.json` - dodano jspdf, jspdf-autotable
11. ✅ `package-lock.json` - automatycznie zaktualizowany
12. ✅ `public/manifest.json` - poprawiono ikony

---

## 🔑 Kluczowe fragmenty kodu do zintegrowania

### 1. App.tsx - Import i routing

```typescript
// Na górze pliku
import BTWAangifte from './pages/BTWAangifte';
import { Receipt } from '@phosphor-icons/react';

// W type Page
type Page = 'dashboard' | 'invoices' | 'invoices-new' | 'clients' | 'products' | 'kilometers' | 'btw' | 'reports' | 'settings';

// W navItems
const navItems = [
  // ... inne items
  { id: 'kilometers' as Page, icon: Car, label: t('nav.kilometers') },
  { id: 'btw' as Page, icon: Receipt, label: t('nav.btw') },
  { id: 'reports' as Page, icon: ChartBar, label: t('nav.reports') },
  // ...
];

// W renderPage()
switch (currentPage) {
  // ... inne cases
  case 'btw':
    return <BTWAangifte />;
  // ...
}
```

### 2. i18n/pl.ts - Tłumaczenia

```typescript
nav: {
  // ... inne
  btw: 'BTW Aangifte',
  // ...
},
btw: {
  title: 'Deklaracja BTW',
  subtitle: 'Kwartalne deklaracje BTW dla ZZP',
  declarationSaved: 'Deklaracja zapisana',
  declarationUpdated: 'Deklaracja zaktualizowana',
  declarationDeleted: 'Deklaracja usunięta',
  // ... ~60 więcej kluczy (sprawdź w repo)
},
```

### 3. package.json - Zależności

```json
"dependencies": {
  // ... inne
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.3",
  // ...
}
```

---

## ✅ Weryfikacja po integracji

1. Zainstaluj pakiety: `npm install`
2. Uruchom dev server: `npm run dev`
3. Otwórz aplikację: http://localhost:5000
4. Sprawdź czy w menu jest przycisk "BTW Aangifte"
5. Kliknij na BTW - powinna załadować się strona z 4 kartami
6. Wybierz rok i kwartał - dane powinny się automatycznie przeliczyć
7. Sprawdź czy pobiera faktury, wydatki, kilometry
8. Przetestuj zapis deklaracji
9. Przetestuj eksport do PDF

---

## 🆘 Troubleshooting

**Problem: "Cannot find module 'jspdf'"**
```bash
npm install jspdf jspdf-autotable
```

**Problem: "BTWAangifte is not defined"**
- Sprawdź czy w App.tsx jest: `import BTWAangifte from './pages/BTWAangifte';`

**Problem: "Missing translation key"**
- Sprawdź czy w src/i18n/pl.ts, nl.ts, en.ts są wszystkie klucze z sekcji `btw: { }`

**Problem: "Type error in useElectronDB"**
- Sprawdź czy src/types/electron.d.ts ma metody: getBTW, createBTW, updateBTW, deleteBTW

---

## 📊 Statystyki zmian

- **+3595 linii dodanych**
- **-605 linii usuniętych**
- **17 plików zmienionych**
- **4 nowe pliki**
- **13 zmodyfikowanych plików**

Commit ID: `d939924`
Branch: `main`
Repo: `https://github.com/norbi07011/mesu-bouw-`

---

## 🎯 Główne funkcje BTW Aangifte

1. ✅ **Automatyczne kalkulacje** - pobiera dane z faktur, wydatków, kilometrów
2. ✅ **Dashboard wizualny** - 4 karty z podsumowaniem (przychody, VAT należny, VAT naliczony, saldo)
3. ✅ **Selektor okresu** - wybór roku i kwartału (Q1-Q4)
4. ✅ **Monitoring deadline** - ostrzeżenia o zbliżających się terminach
5. ✅ **Szczegółowa tabela** - holenderskie rubryki BTW (1a-5b)
6. ✅ **Zarządzanie deklaracjami** - zapis jako draft/submitted
7. ✅ **Historia** - wszystkie zapisane deklaracje
8. ✅ **Export PDF** - gotowy formularz BTW
9. ✅ **Wielojęzyczność** - PL, NL, EN
10. ✅ **Holenderski system VAT** - 21%, 9%, 0%, reverse charge, prywatne km

---

**Powodzenia z integracją! 🚀**
