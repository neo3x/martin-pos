import { ipcRenderer } from 'electron';

// Expose printer functions to renderer
(window as any).printer = {
  printReceipt: (data: any) => ipcRenderer.invoke('print-receipt', data),
  printLabel: (data: any) => ipcRenderer.invoke('print-label', data),
};
