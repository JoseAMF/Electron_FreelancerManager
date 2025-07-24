import { Injectable } from '@angular/core';
import { Config } from '../../../../app/backend/entities';
import { BackendService } from './backend/backend.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  constructor(private backendService: BackendService) {}

  async getConfig(key: string): Promise<string | null> {
    return await this.backendService.invokeBackend('config', 'get', key);
  }

  async setConfig(key: string, value: string): Promise<Config> {
    return await this.backendService.invokeBackend('config', 'set', key, value);
  }

  async getAllConfigs(): Promise<Config[]> {
    return await this.backendService.invokeBackend('config', 'getAll');
  }

  async deleteConfig(key: string): Promise<boolean> {
    return await this.backendService.invokeBackend('config', 'delete', key);
  }
}