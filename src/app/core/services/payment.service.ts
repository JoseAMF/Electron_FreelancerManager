import { Injectable } from '@angular/core';
import { Payment } from '../../../../app/backend/entities';
import { BackendService } from './backend/backend.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private backendService: BackendService) {}

  async createPayment(paymentData: Partial<Payment>): Promise<Payment> {
    return await this.backendService.invokeBackend('payment', 'create', paymentData);
  }

  async getAllPayments(): Promise<Payment[]> {
    return await this.backendService.invokeBackend('payment', 'getAll');
  }

  async getPaymentById(id: number): Promise<Payment | null> {
    return await this.backendService.invokeBackend('payment', 'getById', id);
  }

  async getPaymentsByJob(jobId: number): Promise<Payment[]> {
    return await this.backendService.invokeBackend('payment', 'getByJob', jobId);
  }

  async getPaymentsByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    return await this.backendService.invokeBackend('payment', 'getByDateRange', startDate, endDate);
  }

  async updatePayment(id: number, updateData: Partial<Payment>): Promise<Payment | null> {
    return await this.backendService.invokeBackend('payment', 'update', id, updateData);
  }

  async deletePayment(id: number): Promise<boolean> {
    return await this.backendService.invokeBackend('payment', 'delete', id);
  }

  async getPaymentStats(): Promise<any> {
    return await this.backendService.invokeBackend('payment', 'getStats');
  }
}