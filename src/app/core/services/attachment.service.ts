import { Injectable } from '@angular/core';
import { Attachment } from '../../../../app/backend/entities';
import { BackendService } from './backend/backend.service';

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {
  constructor(private backendService: BackendService) {}

  async createAttachment(attachmentData: Partial<Attachment>): Promise<Attachment> {
    return await this.backendService.invokeBackend('attachment', 'create', attachmentData);
  }

  async getAllAttachments(): Promise<Attachment[]> {
    return await this.backendService.invokeBackend('attachment', 'getAll');
  }

  async getAttachmentById(id: number): Promise<Attachment | null> {
    return await this.backendService.invokeBackend('attachment', 'getById', id);
  }

  async getAttachmentsByJob(jobId: number): Promise<Attachment[]> {
    return await this.backendService.invokeBackend('attachment', 'getByJob', jobId);
  }

  async deleteAttachment(id: number): Promise<boolean> {
    return await this.backendService.invokeBackend('attachment', 'delete', id);
  }

  async saveFile(fileName: string, fileBuffer: ArrayBuffer, subPath: string, jobId?: number, paymentId?: number): Promise<Attachment> {    
    return await this.backendService.invokeBackend('attachment', 'saveFile', fileName, fileBuffer, subPath, jobId, paymentId);
  }

  async getFileContent(id: number): Promise<ArrayBuffer | null> {
    return await this.backendService.invokeBackend('attachment', 'getContent', id);
  }

  async openFile(id: number): Promise<{ success: boolean; error?: string }> {
    return await this.backendService.invokeBackend('filesystem', 'openFile', id);
  }

  async showInFolder(id: number): Promise<{ success: boolean; error?: string }> {
    return await this.backendService.invokeBackend('filesystem', 'showInFolder', id);
  }
}