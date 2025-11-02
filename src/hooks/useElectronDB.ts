import { useState, useEffect, useCallback } from 'react';

// Sprawdź czy działamy w Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron;
};

// Mock storage dla fallback gdy nie ma Electron
const mockStorage = {
  store: new Map<string, any>(),
  getItem: (key: string) => {
    const item = mockStorage.store.get(key);
    return item ? JSON.stringify(item) : null;
  },
  setItem: (key: string, value: string) => {
    try {
      mockStorage.store.set(key, JSON.parse(value));
    } catch {
      mockStorage.store.set(key, value);
    }
  },
  removeItem: (key: string) => {
    mockStorage.store.delete(key);
  }
};

// Hook dla bazy danych (zamiennik useKV)
export function useElectronDB<T>(
  key: string,
  defaultValue: T,
  entityType?: 'invoices' | 'clients' | 'products' | 'company'
): [T, (value: T) => Promise<void>, boolean] {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  // Funkcja do pobierania danych
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI) {
        let result: any;
        
        switch (entityType) {
          case 'invoices':
            result = await window.electronAPI.database.getInvoices();
            break;
          case 'clients':
            result = await window.electronAPI.database.getClients();
            break;
          case 'products':
            result = await window.electronAPI.database.getProducts();
            break;
          case 'company':
            result = await window.electronAPI.database.getCompany();
            break;
          default:
            // Fallback na localStorage
            const stored = localStorage.getItem(key) || mockStorage.getItem(key);
            result = stored ? JSON.parse(stored) : defaultValue;
        }
        
        setData(result || defaultValue);
      } else {
        // Fallback na localStorage gdy nie ma Electron
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            setData(JSON.parse(stored));
          } catch {
            setData(defaultValue);
          }
        } else {
          setData(defaultValue);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      setData(defaultValue);
    } finally {
      setLoading(false);
    }
  }, [key, defaultValue, entityType]);

  // Funkcja do zapisywania danych
  const updateData = useCallback(async (newValue: T) => {
    try {
      if (isElectron() && window.electronAPI && entityType) {
        // Zapisz do Electron SQLite
        switch (entityType) {
          case 'company':
            if (newValue) {
              await window.electronAPI.database.updateCompany(newValue);
            }
            break;
          // Inne typy będą obsługiwane przez dedykowane funkcje CRUD
          default:
            console.warn(`Direct update not supported for ${entityType}, use specific CRUD functions`);
        }
      } else {
        // Fallback na localStorage
        localStorage.setItem(key, JSON.stringify(newValue));
      }
      
      setData(newValue);
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      throw error;
    }
  }, [key, entityType]);

  // Ładuj dane przy mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [data, updateData, loading];
}

// Hook dla CRUD operacji na fakturach
export function useInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.getInvoices();
        setInvoices(result || []);
      } else {
        // Fallback na localStorage
        const stored = localStorage.getItem('invoices');
        setInvoices(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvoice = useCallback(async (invoice: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.createInvoice(invoice);
        await fetchInvoices(); // Odśwież listę
        return result;
      } else {
        // Fallback na localStorage
        const stored = localStorage.getItem('invoices');
        const invoices = stored ? JSON.parse(stored) : [];
        const newInvoice = { ...invoice, id: Date.now().toString() };
        const updated = [...invoices, newInvoice];
        localStorage.setItem('invoices', JSON.stringify(updated));
        await fetchInvoices();
        return newInvoice;
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }, [fetchInvoices]);

  const updateInvoice = useCallback(async (id: string, invoice: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.updateInvoice(id, invoice);
        await fetchInvoices();
        return result;
      } else {
        // Fallback na localStorage
        const stored = localStorage.getItem('invoices');
        const invoices = stored ? JSON.parse(stored) : [];
        const updated = invoices.map((inv: any) => inv.id === id ? { ...inv, ...invoice } : inv);
        localStorage.setItem('invoices', JSON.stringify(updated));
        await fetchInvoices();
        return invoice;
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }, [fetchInvoices]);

  const deleteInvoice = useCallback(async (id: string) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.deleteInvoice(id);
        await fetchInvoices();
        return result;
      } else {
        // Fallback na localStorage
        const stored = localStorage.getItem('invoices');
        const invoices = stored ? JSON.parse(stored) : [];
        const updated = invoices.filter((inv: any) => inv.id !== id);
        localStorage.setItem('invoices', JSON.stringify(updated));
        await fetchInvoices();
        return true;
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }, [fetchInvoices]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refetch: fetchInvoices
  };
}

// Hook dla klientów
export function useClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.getClients();
        setClients(result || []);
      } else {
        const stored = localStorage.getItem('clients');
        setClients(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (client: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.createClient(client);
        await fetchClients();
        return result;
      } else {
        const stored = localStorage.getItem('clients');
        const clients = stored ? JSON.parse(stored) : [];
        const newClient = { ...client, id: Date.now().toString() };
        const updated = [...clients, newClient];
        localStorage.setItem('clients', JSON.stringify(updated));
        await fetchClients();
        return newClient;
      }
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }, [fetchClients]);

  const updateClient = useCallback(async (id: string, client: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.updateClient(id, client);
        await fetchClients();
        return result;
      } else {
        const stored = localStorage.getItem('clients');
        const clients = stored ? JSON.parse(stored) : [];
        const updated = clients.map((cli: any) => cli.id === id ? { ...cli, ...client } : cli);
        localStorage.setItem('clients', JSON.stringify(updated));
        await fetchClients();
        return client;
      }
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }, [fetchClients]);

  const deleteClient = useCallback(async (id: string) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.deleteClient(id);
        await fetchClients();
        return result;
      } else {
        const stored = localStorage.getItem('clients');
        const clients = stored ? JSON.parse(stored) : [];
        const updated = clients.filter((cli: any) => cli.id !== id);
        localStorage.setItem('clients', JSON.stringify(updated));
        await fetchClients();
        return true;
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }, [fetchClients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients
  };
}

// Hook dla produktów
export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.getProducts();
        setProducts(result || []);
      } else {
        const stored = localStorage.getItem('products');
        setProducts(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (product: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.createProduct(product);
        await fetchProducts();
        return result;
      } else {
        const stored = localStorage.getItem('products');
        const products = stored ? JSON.parse(stored) : [];
        const newProduct = { ...product, id: Date.now().toString() };
        const updated = [...products, newProduct];
        localStorage.setItem('products', JSON.stringify(updated));
        await fetchProducts();
        return newProduct;
      }
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: string, product: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.updateProduct(id, product);
        await fetchProducts();
        return result;
      } else {
        const stored = localStorage.getItem('products');
        const products = stored ? JSON.parse(stored) : [];
        const updated = products.map((prod: any) => prod.id === id ? { ...prod, ...product } : prod);
        localStorage.setItem('products', JSON.stringify(updated));
        await fetchProducts();
        return product;
      }
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.deleteProduct(id);
        await fetchProducts();
        return result;
      } else {
        const stored = localStorage.getItem('products');
        const products = stored ? JSON.parse(stored) : [];
        const updated = products.filter((prod: any) => prod.id !== id);
        localStorage.setItem('products', JSON.stringify(updated));
        await fetchProducts();
        return true;
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts
  };
}

// Hook dla firmy
export function useCompany() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.getCompany();
        setCompany(result);
      } else {
        const stored = localStorage.getItem('company');
        setCompany(stored ? JSON.parse(stored) : null);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCompany = useCallback(async (companyData: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.updateCompany(companyData);
        setCompany(result);
        return result;
      } else {
        localStorage.setItem('company', JSON.stringify(companyData));
        setCompany(companyData);
        return companyData;
      }
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return {
    company,
    loading,
    updateCompany,
    refetch: fetchCompany
  };
}

// Hook dla file system operacji
export function useFileSystem() {
  const savePDF = useCallback(async (filename: string, buffer: ArrayBuffer) => {
    if (isElectron() && window.electronAPI) {
      return await window.electronAPI.fileSystem.savePDF(filename, buffer);
    } else {
      // Fallback - pobierz plik
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return filename;
    }
  }, []);

  const openDocumentsFolder = useCallback(async () => {
    if (isElectron() && window.electronAPI) {
      return await window.electronAPI.fileSystem.openDocumentsFolder();
    } else {
      console.log('Documents folder opening not available in browser');
    }
  }, []);

  const exportCSV = useCallback(async (filename: string, data: any) => {
    if (isElectron() && window.electronAPI) {
      return await window.electronAPI.fileSystem.exportCSV(filename, data);
    } else {
      // Browser fallback
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return filename;
    }
  }, []);

  const exportExcel = useCallback(async (filename: string, data: any) => {
    if (isElectron() && window.electronAPI) {
      return await window.electronAPI.fileSystem.exportExcel(filename, data);
    } else {
      console.log('Excel export not available in browser');
      return '';
    }
  }, []);

  return {
    savePDF,
    openDocumentsFolder,
    exportCSV,
    exportExcel
  };
}

// Hook dla wydatków (Expenses)
export function useExpenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.getExpenses) {
        const result = await window.electronAPI.database.getExpenses();
        setExpenses(result || []);
      } else {
        const stored = localStorage.getItem('expenses');
        setExpenses(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (expense: any) => {
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.createExpense) {
        const result = await window.electronAPI.database.createExpense(expense);
        await fetchExpenses();
        return result;
      } else {
        const stored = localStorage.getItem('expenses');
        const expenses = stored ? JSON.parse(stored) : [];
        const newExpense = { ...expense, id: Date.now().toString(), created_at: new Date().toISOString() };
        const updated = [...expenses, newExpense];
        localStorage.setItem('expenses', JSON.stringify(updated));
        await fetchExpenses();
        return newExpense;
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }, [fetchExpenses]);

  const updateExpense = useCallback(async (id: string, expense: any) => {
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.updateExpense) {
        const result = await window.electronAPI.database.updateExpense(id, expense);
        await fetchExpenses();
        return result;
      } else {
        const stored = localStorage.getItem('expenses');
        const expenses = stored ? JSON.parse(stored) : [];
        const updated = expenses.map((exp: any) => exp.id === id ? { ...exp, ...expense, updated_at: new Date().toISOString() } : exp);
        localStorage.setItem('expenses', JSON.stringify(updated));
        await fetchExpenses();
        return expense;
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.deleteExpense) {
        const result = await window.electronAPI.database.deleteExpense(id);
        await fetchExpenses();
        return result;
      } else {
        const stored = localStorage.getItem('expenses');
        const expenses = stored ? JSON.parse(stored) : [];
        const updated = expenses.filter((exp: any) => exp.id !== id);
        localStorage.setItem('expenses', JSON.stringify(updated));
        await fetchExpenses();
        return true;
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }, [fetchExpenses]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses
  };
}

// Hook dla kilometrów
export function useKilometers() {
  const [kilometers, setKilometers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKilometers = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.getKilometers) {
        const result = await window.electronAPI.database.getKilometers();
        setKilometers(result || []);
      } else {
        const stored = localStorage.getItem('kilometer-entries');
        setKilometers(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error fetching kilometers:', error);
      // Fallback do localStorage
      const stored = localStorage.getItem('kilometer-entries');
      setKilometers(stored ? JSON.parse(stored) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const createKilometer = useCallback(async (kilometer: any) => {
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.createKilometer) {
        const result = await window.electronAPI.database.createKilometer(kilometer);
        await fetchKilometers();
        return result;
      } else {
        const stored = localStorage.getItem('kilometer-entries');
        const kilometers = stored ? JSON.parse(stored) : [];
        const newKilometer = { ...kilometer, id: Date.now().toString(), createdAt: new Date().toISOString() };
        const updated = [...kilometers, newKilometer];
        localStorage.setItem('kilometer-entries', JSON.stringify(updated));
        await fetchKilometers();
        return newKilometer;
      }
    } catch (error) {
      console.error('Error creating kilometer:', error);
      throw error;
    }
  }, [fetchKilometers]);

  const updateKilometer = useCallback(async (id: string, kilometer: any) => {
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.updateKilometer) {
        const result = await window.electronAPI.database.updateKilometer(id, kilometer);
        await fetchKilometers();
        return result;
      } else {
        const stored = localStorage.getItem('kilometer-entries');
        const kilometers = stored ? JSON.parse(stored) : [];
        const updated = kilometers.map((km: any) => km.id === id ? { ...km, ...kilometer, updatedAt: new Date().toISOString() } : km);
        localStorage.setItem('kilometer-entries', JSON.stringify(updated));
        await fetchKilometers();
        return kilometer;
      }
    } catch (error) {
      console.error('Error updating kilometer:', error);
      throw error;
    }
  }, [fetchKilometers]);

  const deleteKilometer = useCallback(async (id: string) => {
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.deleteKilometer) {
        const result = await window.electronAPI.database.deleteKilometer(id);
        await fetchKilometers();
        return result;
      } else {
        const stored = localStorage.getItem('kilometer-entries');
        const kilometers = stored ? JSON.parse(stored) : [];
        const updated = kilometers.filter((km: any) => km.id !== id);
        localStorage.setItem('kilometer-entries', JSON.stringify(updated));
        await fetchKilometers();
        return true;
      }
    } catch (error) {
      console.error('Error deleting kilometer:', error);
      throw error;
    }
  }, [fetchKilometers]);

  useEffect(() => {
    fetchKilometers();
  }, [fetchKilometers]);

  return {
    kilometers,
    loading,
    createKilometer,
    updateKilometer,
    deleteKilometer,
    refetch: fetchKilometers
  };
}

// Hook dla deklaracji BTW
export function useBTW() {
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeclarations = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.getBTWDeclarations) {
        const result = await window.electronAPI.database.getBTWDeclarations();
        setDeclarations(result || []);
      } else {
        const stored = localStorage.getItem('btw-declarations');
        setDeclarations(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error fetching BTW declarations:', error);
      const stored = localStorage.getItem('btw-declarations');
      setDeclarations(stored ? JSON.parse(stored) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const getBTWByPeriod = useCallback(async (year: number, period: string) => {
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.getBTWByPeriod) {
        return await window.electronAPI.database.getBTWByPeriod(year, period);
      } else {
        const stored = localStorage.getItem('btw-declarations');
        const declarations = stored ? JSON.parse(stored) : [];
        return declarations.find((d: any) => d.year === year && d.period === period) || null;
      }
    } catch (error) {
      console.error('Error fetching BTW by period:', error);
      return null;
    }
  }, []);

  const createBTW = useCallback(async (btw: any) => {
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.createBTW) {
        const result = await window.electronAPI.database.createBTW(btw);
        await fetchDeclarations();
        return result;
      } else {
        const stored = localStorage.getItem('btw-declarations');
        const declarations = stored ? JSON.parse(stored) : [];
        const newBTW = { 
          ...btw, 
          id: Date.now().toString(), 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const updated = [...declarations, newBTW];
        localStorage.setItem('btw-declarations', JSON.stringify(updated));
        await fetchDeclarations();
        return newBTW;
      }
    } catch (error) {
      console.error('Error creating BTW:', error);
      throw error;
    }
  }, [fetchDeclarations]);

  const updateBTW = useCallback(async (id: string, btw: any) => {
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.updateBTW) {
        const result = await window.electronAPI.database.updateBTW(id, btw);
        await fetchDeclarations();
        return result;
      } else {
        const stored = localStorage.getItem('btw-declarations');
        const declarations = stored ? JSON.parse(stored) : [];
        const updated = declarations.map((decl: any) => 
          decl.id === id ? { ...decl, ...btw, updated_at: new Date().toISOString() } : decl
        );
        localStorage.setItem('btw-declarations', JSON.stringify(updated));
        await fetchDeclarations();
        return btw;
      }
    } catch (error) {
      console.error('Error updating BTW:', error);
      throw error;
    }
  }, [fetchDeclarations]);

  const deleteBTW = useCallback(async (id: string) => {
    try {
      if (isElectron() && window.electronAPI && window.electronAPI.database.deleteBTW) {
        const result = await window.electronAPI.database.deleteBTW(id);
        await fetchDeclarations();
        return result;
      } else {
        const stored = localStorage.getItem('btw-declarations');
        const declarations = stored ? JSON.parse(stored) : [];
        const updated = declarations.filter((decl: any) => decl.id !== id);
        localStorage.setItem('btw-declarations', JSON.stringify(updated));
        await fetchDeclarations();
        return true;
      }
    } catch (error) {
      console.error('Error deleting BTW:', error);
      throw error;
    }
  }, [fetchDeclarations]);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  return {
    declarations,
    loading,
    createBTW,
    updateBTW,
    deleteBTW,
    getBTWByPeriod,
    refetch: fetchDeclarations
  };
}

// Pomocnicza funkcja do konwersji na CSV
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ];
  
  return '\uFEFF' + csvRows.join('\n'); // BOM dla polskich znaków
}