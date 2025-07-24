import { Injectable } from '@angular/core';
import { Client } from '../../../../app/backend/entities';
import { BackendService } from './backend/backend.service';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  constructor(private backendService: BackendService) {}

  async createClient(clientData: Partial<Client>): Promise<Client> {
    return await this.backendService.invokeBackend('client', 'create', clientData);
  }

  async getAllClients(): Promise<Client[]> {
    return await this.backendService.invokeBackend('client', 'getAll');
  }

  async getClientById(id: number): Promise<Client | null> {
    return await this.backendService.invokeBackend('client', 'getById', id);
  }

  async updateClient(id: number, updateData: Partial<Client>): Promise<Client | null> {
    return await this.backendService.invokeBackend('client', 'update', id, updateData);
  }

  async deleteClient(id: number): Promise<boolean> {
    return await this.backendService.invokeBackend('client', 'delete', id);
  }

  async searchClients(searchTerm: string): Promise<Client[]> {
    return await this.backendService.invokeBackend('client', 'search', searchTerm);
  }
}