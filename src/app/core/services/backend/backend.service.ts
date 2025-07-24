import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private electronAPI: any;

  constructor() {
    // Check if we're running in Electron and get the API
    if (this.isElectron) {
      this.electronAPI = (window as any).electronAPI;
    }
  }

  get isElectron(): boolean {
    return !!(window && (window as any).electronAPI);
  }

  checkElectronAPI(): void {
    if (!this.electronAPI) {
      throw new Error('Backend API not available - make sure you are running in Electron environment');
    }
  }

  // Database operations
  async initializeDatabase(): Promise<void> {
    this.checkElectronAPI();
    return await this.electronAPI.database.initialize();
  }

  // App information
  async getAppVersion(): Promise<string> {
    this.checkElectronAPI();
    return await this.electronAPI.app.getVersion();
  }

  async getPlatform(): Promise<string> {
    this.checkElectronAPI();
    return await this.electronAPI.app.getPlatform();
  }

  // Generic method for backend operations
  async invokeBackend(channel: string, method: string, ...args: any[]): Promise<any> {
    this.checkElectronAPI();
    return await this.electronAPI[channel][method](...args);
  }

  // Specific backend API methods
  getElectronAPI() {
    this.checkElectronAPI();
    return this.electronAPI;
  }
}