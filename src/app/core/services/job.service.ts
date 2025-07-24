import { Injectable } from '@angular/core';
import { Job } from '../../../../app/backend/entities';
import { BackendService } from './backend/backend.service';
import { Status } from '../../../../app/backend/entities/status.enum';


@Injectable({
  providedIn: 'root'
})
export class JobService {
  constructor(private backendService: BackendService) {}

  async createJob(jobData: Partial<Job>): Promise<Job> {
    return await this.backendService.invokeBackend('job', 'create', jobData);
  }

  async getAllJobs(): Promise<Job[]> {
    return await this.backendService.invokeBackend('job', 'getAll');
  }

  async getJobById(id: number): Promise<Job | null> {
    return await this.backendService.invokeBackend('job', 'getById', id);
  }

  async getJobsByClient(clientId: number): Promise<Job[]> {
    return await this.backendService.invokeBackend('job', 'getByClient', clientId);
  }

  async getJobsByStatus(status: Status): Promise<Job[]> {
    return await this.backendService.invokeBackend('job', 'getByStatus', status);
  }

  async updateJob(id: number, updateData: Partial<Job>): Promise<Job | null> {
    return await this.backendService.invokeBackend('job', 'update', id, updateData);
  }

  async updateStatus(id: number, status: Status): Promise<Job | null> {
    return await this.backendService.invokeBackend('job', 'updateStatus', id, status);
  }

  async deleteJob(id: number): Promise<boolean> {
    return await this.backendService.invokeBackend('job', 'delete', id);
  }

  async searchJobs(searchTerm: string): Promise<Job[]> {
    return await this.backendService.invokeBackend('job', 'search', searchTerm);
  }

  async getJobStats(): Promise<any> {
    return await this.backendService.invokeBackend('job', 'getStats');
  }
}