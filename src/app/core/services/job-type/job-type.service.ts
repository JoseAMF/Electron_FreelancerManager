import { Injectable } from '@angular/core';
import { BackendService } from '../backend/backend.service';
import { JobType } from '../../../shared/types/entities';

@Injectable({
  providedIn: 'root'
})
export class JobTypeService {

  constructor(private backendService: BackendService) { }

  async createJobType(jobTypeData: Partial<JobType>): Promise<JobType> {
    return await this.backendService.invokeBackend('jobType', 'create', jobTypeData);
  }

  async getAllJobTypes(): Promise<JobType[]> {
    return await this.backendService.invokeBackend('jobType', 'getAll');
  }

  async getJobTypeById(id: number): Promise<JobType> {
    return await this.backendService.invokeBackend('jobType', 'getById', id);
  }

  async updateJobType(id: number, updateData: Partial<JobType>): Promise<JobType> {
    return await this.backendService.invokeBackend('jobType', 'update', id, updateData);
  }

  async deleteJobType(id: number): Promise<boolean> {
    return await this.backendService.invokeBackend('jobType', 'delete', id);
  }

  async searchJobTypes(searchTerm: string): Promise<JobType[]> {
    return await this.backendService.invokeBackend('jobType', 'search', searchTerm);
  }
}
