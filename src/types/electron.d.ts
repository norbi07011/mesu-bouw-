// Typy Electron API dla TypeScript
declare global {
  interface Window {
    electronAPI: {
      database: {
        getInvoices: () => Promise<any[]>;
        createInvoice: (invoice: any) => Promise<any>;
        updateInvoice: (id: string, invoice: any) => Promise<any>;
        deleteInvoice: (id: string) => Promise<boolean>;
        getClients: () => Promise<any[]>;
        createClient: (client: any) => Promise<any>;
        updateClient: (id: string, client: any) => Promise<any>;
        deleteClient: (id: string) => Promise<boolean>;
        getProducts: () => Promise<any[]>;
        createProduct: (product: any) => Promise<any>;
        updateProduct: (id: string, product: any) => Promise<any>;
        deleteProduct: (id: string) => Promise<boolean>;
        getCompany: () => Promise<any>;
        updateCompany: (company: any) => Promise<any>;
        getExpenses: () => Promise<any[]>;
        createExpense: (expense: any) => Promise<any>;
        updateExpense: (id: string, expense: any) => Promise<any>;
        deleteExpense: (id: string) => Promise<boolean>;
        getKilometers: () => Promise<any[]>;
        createKilometer: (kilometer: any) => Promise<any>;
        updateKilometer: (id: string, kilometer: any) => Promise<any>;
        deleteKilometer: (id: string) => Promise<boolean>;
        getBTWDeclarations: () => Promise<any[]>;
        getBTWByPeriod: (year: number, period: string) => Promise<any | null>;
        createBTW: (btw: any) => Promise<any>;
        updateBTW: (id: string, btw: any) => Promise<any>;
        deleteBTW: (id: string) => Promise<boolean>;
      };
      fileSystem: {
        savePDF: (filename: string, buffer: ArrayBuffer) => Promise<string>;
        saveCompanyLogo: (filename: string, data: Uint8Array) => Promise<string>;
        getCompanyLogoPath: (filename: string) => Promise<string>;
        openDocumentsFolder: () => Promise<void>;
        exportCSV: (filename: string, data: any) => Promise<string>;
        exportExcel: (filename: string, data: any) => Promise<string>;
      };
      backup: {
        create: (path?: string) => Promise<string>;
        restore: (backupPath: string) => Promise<boolean>;
        list: () => Promise<any[]>;
        autoBackup: () => Promise<string>;
      };
      dialog: {
        showSaveDialog: (options: any) => Promise<any>;
        showOpenDialog: (options: any) => Promise<any>;
      };
      build: {
        createInstaller: () => Promise<boolean>;
        openInstallerFolder: () => Promise<void>;
      };
      getNetworkAddress: () => Promise<string>;
      copyToClipboard: (text: string) => Promise<void>;
      onMenuAction: (callback: (action: string) => void) => () => void;
      isElectron: boolean;
      version: string;
      platform: string;
    };
  }
}

export {};