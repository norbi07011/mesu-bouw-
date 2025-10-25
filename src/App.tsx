import { useState } from 'react';
import { Toaster } from 'sonner';
import './i18n';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { House, FileText, Users, Package, ChartBar, Gear } from '@phosphor-icons/react';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

type Page = 'dashboard' | 'invoices' | 'invoices-new' | 'clients' | 'products' | 'reports' | 'settings';

function App() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const navItems = [
    { id: 'dashboard' as Page, icon: House, label: t('nav.dashboard') },
    { id: 'invoices' as Page, icon: FileText, label: t('nav.invoices') },
    { id: 'clients' as Page, icon: Users, label: t('nav.clients') },
    { id: 'products' as Page, icon: Package, label: t('nav.products') },
    { id: 'reports' as Page, icon: ChartBar, label: t('nav.reports') },
    { id: 'settings' as Page, icon: Gear, label: t('nav.settings') },
  ];

  const renderPage = () => {
    const handleNavigate = (page: string) => setCurrentPage(page as Page);
    
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'invoices':
        return <Invoices onNavigate={handleNavigate} />;
      case 'invoices-new':
        return <InvoiceForm onNavigate={handleNavigate} />;
      case 'clients':
        return <Clients />;
      case 'products':
        return <Products />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="w-64 min-h-screen border-r bg-card">
          <div className="p-6">
            <h1 className="text-2xl font-bold">NORBS SERVICE</h1>
            <p className="text-sm text-muted-foreground">Invoice Management</p>
          </div>
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id || 
                (item.id === 'invoices' && currentPage === 'invoices-new');
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setCurrentPage(item.id)}
                >
                  <Icon className="mr-3" size={20} />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          {renderPage()}
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;