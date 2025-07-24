import { Repository } from 'typeorm';
import { Attachment } from '../entities/attachment.entity';
import { OrmDatabaseService } from '../database/orm-database.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import { Config } from '../entities';

export class AttachmentService {
  private attachmentRepository: Repository<Attachment>;
  private configRepository: Repository<Config>;
  private attachmentsPath: string;

  constructor(private dbService: OrmDatabaseService) {
    this.attachmentRepository = this.dbService.getDataSource().getRepository(Attachment);
    this.configRepository = this.dbService.getDataSource().getRepository(Config);
    this.attachmentsPath = path.join(app.getPath('userData'), 'attachments');
    this.setAttachmentsPath();
    this.ensureAttachmentsDirectory();
  }

  private async ensureAttachmentsDirectory(): Promise<void> {
    try {
      await fs.access(this.attachmentsPath);
    } catch {
      await fs.mkdir(this.attachmentsPath, { recursive: true });
    }
  }

  private async setAttachmentsPath(): Promise<void> {
    const config = await this.configRepository.findOne({ where: { key: 'attachmentsPath' } });
    
    if(config == null || config.value) return;
    this.attachmentsPath = config?.value;
  }

  async createAttachment(attachmentData: Partial<Attachment>): Promise<Attachment> {
    const attachment = this.attachmentRepository.create(attachmentData);
    return await this.attachmentRepository.save(attachment);
  }

  async getAllAttachments(): Promise<Attachment[]> {
    return await this.attachmentRepository.find({
      relations: ['job'],
      order: { created_at: 'DESC' }
    });
  }

  async getAttachmentById(id: number): Promise<Attachment | null> {
    return await this.attachmentRepository.findOne({
      where: { id },
      relations: ['job']
    });
  }

  async getAttachmentsByJob(jobId: number): Promise<Attachment[]> {
    return await this.attachmentRepository.find({
      where: { job: { id: jobId } },
      relations: ['job']
    });
  }

  async updateAttachment(id: number, updateData: Partial<Attachment>): Promise<Attachment | null> {
    await this.attachmentRepository.update(id, updateData);
    return await this.getAttachmentById(id);
  }

  async deleteAttachment(id: number): Promise<boolean> {
    const attachment = await this.getAttachmentById(id);
    if (attachment) {
      // Delete physical file
      try {
        await fs.unlink(attachment.file_path);
      } catch (error) {
        console.warn('Could not delete physical file:', error);
      }
    }

    const result = await this.attachmentRepository.delete(id);
    return result.affected != undefined && result.affected > 0;
  }

  async saveFile(fileName: string, fileBuffer: ArrayBuffer, subPath: string, jobId?: number, paymentId?: number): Promise<Attachment> {
    // Debug parameters to file
    const debugInfo = {
      timestamp: new Date().toISOString(),
      method: 'saveFile',
      parameters: {
        fileName,
        fileBufferSize: fileBuffer ? fileBuffer.byteLength : 0,
        subPath,
        jobId,
        paymentId
      }
    };
    
    try {
      const debugPath = path.join(this.attachmentsPath, 'debug.txt');
      const debugLine = JSON.stringify(debugInfo) + '\n';
      await fs.appendFile(debugPath, debugLine);
    } catch (error) {
      console.warn('Could not write debug info:', error);
    }

    const fileExtension = path.extname(fileName);
    const baseName = path.basename(fileName, fileExtension);
    const timestamp = Date.now();
    const uniqueFileName = `${baseName}_${timestamp}${fileExtension}`;

    // Determine directory path based on jobId and paymentId
    let directoryPath: string;
    
    if (paymentId && jobId) {
      // Payment files: jobs/{jobId}/payments/
      directoryPath = path.join(this.attachmentsPath, 'jobs', jobId.toString(), 'payments');
    } else if (jobId) {
      // Job files: jobs/{jobId}/
      directoryPath = path.join(this.attachmentsPath, 'jobs', jobId.toString());
    } else {
      // Fallback: general/
      directoryPath = path.join(this.attachmentsPath, 'general');
    }

    // Ensure directory exists
    await this.ensureDirectoryExists(directoryPath);
    
    const filePath = path.join(directoryPath, uniqueFileName);
    
    // Write the file to disk
    try {
      await fs.writeFile(filePath, Buffer.from(fileBuffer));
    } catch (error) {
      console.error('Error writing file:', error);
    }

    const attachmentData: Partial<Attachment> = {
      file_name: fileName,
      file_extension: fileExtension,
      file_path: filePath,
      job: jobId ? { id: jobId } as any : undefined,
      payment: paymentId ? { id: paymentId } as any : undefined
    };

    return await this.createAttachment(attachmentData);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async getFileContent(id: number): Promise<Buffer | null> {
    const attachment = await this.getAttachmentById(id);
    if (!attachment) return null;

    try {
      return await fs.readFile(attachment.file_path);
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  async getAttachmentsPath(): Promise<string> {
    return this.attachmentsPath;
  }

}