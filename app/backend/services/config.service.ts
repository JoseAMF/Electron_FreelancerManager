import { Repository } from 'typeorm';
import { Config } from '../entities/config.entity';
import { OrmDatabaseService } from '../database/orm-database.service';

export class ConfigService {
  private configRepository: Repository<Config>;

  constructor(private dbService: OrmDatabaseService) {
    this.configRepository = this.dbService.getDataSource().getRepository(Config);
    this.initializeDefaultConfig();
  }

  private async initializeDefaultConfig(): Promise<void> {
    const defaultConfigs = [
      { key: 'attachmentsPath', value: './attachments' },
      { key: 'currency', value: 'USD' },
      { key: 'taxRate', value: '0.00' },
      { key: 'companyName', value: 'Your Company' },
      { key: 'companyEmail', value: 'contact@yourcompany.com' }
    ];

    for (const config of defaultConfigs) {
      const existing = await this.getConfig(config.key);
      if (!existing) {
        await this.setConfig(config.key, config.value);
      }
    }
  }

  async getConfig(key: string): Promise<string | null> {
    const config = await this.configRepository.findOne({ where: { key } });
    return config?.value || null;
  }

  async setConfig(key: string, value: string): Promise<Config> {
    let config = await this.configRepository.findOne({ where: { key } });
    
    if (config) {
      config.value = value;
    } else {
      config = this.configRepository.create({ key, value });
    }
    
    return await this.configRepository.save(config);
  }

  async getAllConfigs(): Promise<Config[]> {
    return await this.configRepository.find();
  }

  async deleteConfig(key: string): Promise<boolean> {
    const result = await this.configRepository.delete({ key });
    return result.affected != undefined && result.affected > 0;
  }

  async getConfigAsNumber(key: string, defaultValue: number = 0): Promise<number> {
    const value = await this.getConfig(key);
    return value ? parseFloat(value) : defaultValue;
  }

  async getConfigAsBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
    const value = await this.getConfig(key);
    return value ? value.toLowerCase() === 'true' : defaultValue;
  }

  // Specific config getters
  async getAttachmentsPath(): Promise<string> {
    return await this.getConfig('attachmentsPath') || './attachments';
  }

  async getCurrency(): Promise<string> {
    return await this.getConfig('currency') || 'USD';
  }

  async getTaxRate(): Promise<number> {
    return await this.getConfigAsNumber('taxRate', 0);
  }

  async getCompanyName(): Promise<string> {
    return await this.getConfig('companyName') || 'Your Company';
  }

  async getCompanyEmail(): Promise<string> {
    return await this.getConfig('companyEmail') || 'contact@yourcompany.com';
  }
}