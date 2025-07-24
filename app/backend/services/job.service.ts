import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { OrmDatabaseService } from '../database/orm-database.service';
import { Status } from '../entities/status.enum';

export class JobService {
  private jobRepository: Repository<Job>;

  constructor(private dbService: OrmDatabaseService) {
    this.jobRepository = this.dbService.getDataSource().getRepository(Job);
  }

  async createJob(jobData: Partial<Job>): Promise<Job> {
    const job = this.jobRepository.create({
      ...jobData,
      status: jobData.status || Status.PENDING
    });
    return await this.jobRepository.save(job);
  }

  async getAllJobs(): Promise<Job[]> {
    return await this.jobRepository.find({
      relations: ['client'],
      order: { created_at: 'DESC' }
    });
  }

  async getJobById(id: number): Promise<Job | null> {
    return await this.jobRepository.findOne({
      where: { id },
      relations: ['client']
    });
  }

  async getJobsByClient(clientId: number): Promise<Job[]> {
    return await this.jobRepository.find({
      where: { client: { id: clientId } },
      relations: ['client'],
      order: { created_at: 'DESC' }
    });
  }

  async getJobsByStatus(status: Status): Promise<Job[]> {
    return await this.jobRepository.find({
      where: { status },
      relations: ['client'],
      order: { created_at: 'DESC' }
    });
  }

  async updateJob(id: number, updateData: Partial<Job>): Promise<Job | null> {
    try {
      const result = await this.jobRepository
        .createQueryBuilder()
        .update(Job)
        .set({
          title: updateData.title,
          description: updateData.description,
          status: updateData.status,
          price: updateData.price,
          client: updateData.client,
          due_date: updateData.due_date,
          start_date: updateData.start_date,
        })
        .where("id = :id", { id })
        .execute();

      if (result.affected === 0) {
        return null;
      }

      // Return the updated job
      return await this.getJobById(id);
    } catch (error) {
      console.error('Error updating job:', error);
      return null;
    }
  }

  async updateStatus(id: number, status: Status): Promise<Job | null> {
    try {
      const result = await this.jobRepository
        .createQueryBuilder()
        .update(Job)
        .set({ status })
        .where("id = :id", { id })
        .execute();

      if (result.affected === 0) {
        return null;
      }

      return await this.getJobById(id);
    } catch (error) {
      console.error('Error updating job status:', error);
      return null;
    }
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await this.jobRepository.delete(id);
    return result.affected != undefined && result.affected > 0;
  }

  async searchJobs(searchTerm: string): Promise<Job[]> {
    return await this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .where('job.title LIKE :search OR job.description LIKE :search OR client.name LIKE :search', {
        search: `%${searchTerm}%`
      })
      .orderBy('job.created_at', 'DESC')
      .getMany();
  }

  async getJobStats(): Promise<any> {
    const totalJobs = await this.jobRepository.count();
    const pendingJobs = await this.jobRepository.count({ where: { status: Status.PENDING } });
    const inProgressJobs = await this.jobRepository.count({ where: { status: Status.IN_PROGRESS } });
    const completedJobs = await this.jobRepository.count({ where: { status: Status.COMPLETED } });
    const cancelledJobs = await this.jobRepository.count({ where: { status: Status.CANCELLED } });

    return {
      total: totalJobs,
      pending: pendingJobs,
      inProgress: inProgressJobs,
      completed: completedJobs,
      cancelled: cancelledJobs
    };
  }

  async getJobsWithHighestPrice(): Promise<Job[]> {
    return await this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .orderBy('job.price', 'DESC')
      .limit(10)
      .getMany();
  }
}