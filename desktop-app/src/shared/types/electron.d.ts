export interface ElectronAPI {
  selectFile: (options: any) => Promise<string | null>;
  selectDirectory: () => Promise<string | null>;
  readFile: (filePath: string) => Promise<any>;
  writeFile: (filePath: string, data: any) => Promise<void>;
  loadPDF: (filePath: string) => Promise<any>;
  savePDF: (filePath: string, pdfData: any) => Promise<void>;
  getSetting: (key: string) => Promise<any>;
  setSetting: (key: string, value: any) => Promise<void>;
  getSecureValue: (key: string) => Promise<string | null>;
  setSecureValue: (key: string, value: string) => Promise<void>;
  deleteSecureValue: (key: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
