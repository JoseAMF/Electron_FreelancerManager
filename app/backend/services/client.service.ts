import { Repository } from 'typeorm';
import { Client } from '../entities/client.entity';
import { OrmDatabaseService } from '../database/orm-database.service';

export class ClientService {
  private clientRepository: Repository<Client>;

  constructor(private dbService: OrmDatabaseService) {
    this.clientRepository = this.dbService.getDataSource().getRepository(Client);
  }

  async createClient(clientData: Partial<Client>): Promise<Client> {
    const client = this.clientRepository.create(clientData);
    return await this.clientRepository.save(client);
  }

  async getAllClients(): Promise<Client[]> {
    return await this.clientRepository.find({
      relations: ['jobs'],
      order: { created_at: 'DESC' }
    });
  }

  async getClientById(id: number): Promise<Client | null> {
    return await this.clientRepository.findOne({
      where: { id },
      relations: ['jobs']
    });
  }

  async getClientByEmail(email: string): Promise<Client | null> {
    return await this.clientRepository.findOne({
      where: { email },
      relations: ['jobs']
    });
  }

  async updateClient(id: number, updateData: Partial<Client>): Promise<Client | null> {
    try {
      // Use raw update with only basic fields, no relations
      const result = await this.clientRepository
        .createQueryBuilder()
        .update(Client)
        .set({
          name: updateData.name,
          email: updateData.email,
          phone: updateData.phone,
          discord: updateData.discord
        })
        .where("id = :id", { id })
        .execute();

      if (result.affected === 0) {
        return null;
      }

      // Return the updated client
      return await this.getClientById(id);
    } catch (error) {
      console.error('Error updating client:', error);
      return null;
    }
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await this.clientRepository.delete(id);
    return result.affected != undefined && result.affected > 0;
  }

  async searchClients(searchTerm: string): Promise<Client[]> {
    return await this.clientRepository
      .createQueryBuilder('client')
      .where('client.name LIKE :search OR client.email LIKE :search', {
        search: `%${searchTerm}%`
      })
      .leftJoinAndSelect('client.jobs', 'jobs')
      .orderBy('client.created_at', 'DESC')
      .getMany();
  }

  async getClientsWithJobCount(): Promise<Client[]> {
    const { entities } = await this.clientRepository
      .createQueryBuilder('client')
      .leftJoin('client.jobs', 'job')
      .select([
        'client.id',
        'client.name',
        'client.email',
        'client.phone',
        'client.discord',
        'client.created_at'
      ])
      .addSelect('COUNT(job.id)', 'jobCount')
      .groupBy('client.id')
      .getRawAndEntities();
    return entities;
  }
}