import { Injectable } from '@angular/core';
import { Job } from '../../../../app/backend/entities';
import { BackendService } from './backend/backend.service';
import { Status } from '../../../../app/backend/entities/status.enum';


@Injectable({
  providedIn: 'root'
})
export class JobService {
  constructor(private backendService: BackendService) {}

  // Utility function to convert Date to DD/MM/YYYY string
  private dateToString(date: Date | string): string {
    if (typeof date === 'string') {
      // If it's already in DD/MM/YYYY format, return as is
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (dateRegex.test(date)) {
        return date;
      }
      // If it's an ISO string or other format, convert it
      date = new Date(date);
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Utility function to convert DD/MM/YYYY string to Date
  private stringToDate(dateString: string): Date {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  // Process job data to convert dates to strings
  private processJobDataForBackend(jobData: Partial<Job>): Partial<Job> {
    const processed = { ...jobData };
    
    if (processed.start_date) {
      processed.start_date = this.dateToString(processed.start_date);
    }
    
    if (processed.due_date) {
      processed.due_date = this.dateToString(processed.due_date);
    }

    if (processed.completed_date) {
      processed.completed_date = this.dateToString(processed.completed_date);
    }
    
    return processed;
  }

  async createJob(jobData: Partial<Job>): Promise<Job> {
    const processedData = this.processJobDataForBackend(jobData);
    return await this.backendService.invokeBackend('job', 'create', processedData);
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
    const processedData = this.processJobDataForBackend(updateData);
    return await this.backendService.invokeBackend('job', 'update', id, processedData);
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

  // Date-filtered job methods
  async getJobsByDateRange(startDate: Date, endDate: Date, status?: Status): Promise<Job[]> {
    return await this.backendService.invokeBackend('job', 'getByDateRange', startDate.toISOString(), endDate.toISOString(), status);
  }

  async getJobsByDay(date: Date, status?: Status): Promise<Job[]> {
    return await this.backendService.invokeBackend('job', 'getByDateRange', date.toISOString(), undefined, status);
  }

  async getJobsByWeek(date: Date, status?: Status): Promise<Job[]> {
    // Calculate week range using moment
    const moment = require('moment');
    const startOfWeek = moment(date).startOf('isoWeek').toDate();
    
    const endOfWeek = moment(date).endOf('isoWeek').toDate();

    console.log(`Fetching jobs from ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()} with status ${status}`);
    return await this.backendService.invokeBackend('job', 'getByDateRange', startOfWeek.toISOString(), endOfWeek.toISOString(), status);
  }

  async getJobsByMonth(date: Date, status?: Status): Promise<Job[]> {
    // Calculate month range using moment
    const moment = require('moment');
    const startOfMonth = moment(date).startOf('month').toDate();
    const endOfMonth = moment(date).endOf('month').toDate();
    return await this.backendService.invokeBackend('job', 'getByDateRange', startOfMonth.toISOString(), endOfMonth.toISOString(), status);
  }

  // Utility methods for frontend use
  getDateAsString(date: Date | string): string {
    return this.dateToString(date);
  }

  parseStringToDate(dateString: string): Date {
    return this.stringToDate(dateString);
  }

  // Migration method (run once to convert existing data)
  async migrateDateFields(): Promise<void> {
    return await this.backendService.invokeBackend('job', 'migrateDateFields');
  }
}