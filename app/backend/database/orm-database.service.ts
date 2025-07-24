import { DataSource, Repository } from 'typeorm';
import * as path from 'path';
import { app } from 'electron';
import { Client } from '../entities/client.entity';
import { Job } from '../entities/job.entity';
import { Attachment } from '../entities/attachment.entity';
import { Payment } from '../entities/payment.entity';
import { Config } from '../entities/config.entity';

export class OrmDatabaseService {
  private dataSource: DataSource | null = null;

  async initialize(): Promise<void> {
    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'app-database.db');

      this.dataSource = new DataSource({
        type: 'sqlite',
        database: dbPath,
        entities: [Client, Job, Attachment, Payment, Config],
        synchronize: true, // Auto-create tables in development
        logging: false
      });

      await this.dataSource.initialize();
      console.log('ORM Database initialized successfully at:', dbPath);
    } catch (error) {
      console.error('Failed to initialize ORM database:', error);
      throw error;
    }
  }

  getDataSource(): DataSource {
    if (!this.dataSource) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.dataSource;
  }

  getClientRepository(): Repository<Client> {
    return this.getDataSource().getRepository(Client);
  }

  getJobRepository(): Repository<Job> {
    return this.getDataSource().getRepository(Job);
  }

  getAttachmentRepository(): Repository<Attachment> {
    return this.getDataSource().getRepository(Attachment);
  }

  getPaymentRepository(): Repository<Payment> {
    return this.getDataSource().getRepository(Payment);
  }

  getConfigRepository(): Repository<Config> {
    return this.getDataSource().getRepository(Config);
  }

  async close(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.dataSource = null;
    }
  }
}