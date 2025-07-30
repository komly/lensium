export interface ElectronAPI {
  // App info
  getVersion: () => Promise<string>;
  
  // System info
  getPlatform: () => string;
  
  // Safe methods for the renderer
  openExternal: (url: string) => Promise<void>;
  
  // Clipboard
  writeText: (text: string) => Promise<void>;
  readText: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
} 