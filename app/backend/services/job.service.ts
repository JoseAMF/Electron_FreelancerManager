import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { OrmDatabaseService } from '../database/orm-database.service';
import { Status } from '../entities/status.enum';
const moment = require('moment');

export class JobService {
  private jobRepository: Repository<Job>;

  constructor(private dbService: OrmDatabaseService) {
    this.jobRepository = this.dbService.getDataSource().getRepository(Job);
  }

  // Utility function to convert Date to DD/MM/YYYY string using Moment.js
  private dateToString(date: Date | string): string {
    if (typeof date === 'string') {
      // If it's already a string, validate and return it
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (dateRegex.test(date)) {
        return date;
      }
      // If it's an ISO string or other format, parse it with moment
      return moment(date).format('DD/MM/YYYY');
    }
    
    return moment(date).format('DD/MM/YYYY');
  }

  // Utility function to convert DD/MM/YYYY string to Date for comparisons using Moment.js
  private stringToDate(dateString: string): Date {
    return moment(dateString, 'DD/MM/YYYY').toDate();
  }

  // Utility function to check if a date string matches a specific day using Moment.js
  private isSameDay(dateString: string, targetDate: Date): boolean {
    const dateFromString = moment(dateString, 'DD/MM/YYYY');
    const targetMoment = moment(targetDate);
    return dateFromString.isSame(targetMoment, 'day');
  }

  // Utility function to check if a date string is within a date range using Moment.js
  private isJobDateInRange(dateString: string, startDate: Date, endDate: Date): boolean {
    const dateFromString = moment(dateString, 'DD/MM/YYYY');
    const startMoment = moment(startDate).startOf('day');
    const endMoment = moment(endDate).endOf('day');
    return dateFromString.isBetween(startMoment, endMoment, 'day', '[]');
  }

  async createJob(jobData: Partial<Job>): Promise<Job> {
    // Convert dates to DD/MM/YYYY string format
    const processedJobData = { ...jobData };
    
    if (processedJobData.start_date) {
      processedJobData.start_date = this.dateToString(processedJobData.start_date);
    }
    
    if (processedJobData.due_date) {
      processedJobData.due_date = this.dateToString(processedJobData.due_date);
    }

    if (processedJobData.completed_date) {
      processedJobData.completed_date = this.dateToString(processedJobData.completed_date);
    }

    const job = this.jobRepository.create({
      ...processedJobData,
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

  async getJobsByDateRange(startDate: Date, endDate?: Date, status?: Status): Promise<Job[]> {
    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client');

    // Convert dates to DD/MM/YYYY strings for database comparison
    const startDateString = this.dateToString(startDate);
    const endDateString = endDate ? this.dateToString(endDate) : startDateString;

    // Build date filtering based on job status and date range logic
    if (endDate) {
      // Range filtering - complex logic based on status
      if (status) {
        // Filter for specific status
        if (status === Status.COMPLETED) {
          queryBuilder.andWhere(`job.status = :status AND job.start_date IS NOT NULL AND job.completed_date IS NOT NULL 
           AND job.start_date <= :endDate AND job.completed_date >= :startDate`, {
            status,
            startDate: startDateString,
            endDate: endDateString
          });
        } else if (status === Status.PENDING) {
          queryBuilder.andWhere(`job.status = :status AND job.due_date >= :startDate AND job.due_date <= :endDate`, {
            status,
            startDate: startDateString,
            endDate: endDateString
          });
        } else if (status === Status.IN_PROGRESS) {
          queryBuilder.andWhere(`job.status = :status AND job.start_date IS NOT NULL 
           AND job.start_date <= :endDate AND (job.completed_date IS NULL OR job.completed_date >= :startDate)`, {
            status,
            startDate: startDateString,
            endDate: endDateString
          });
        }
      } else {
        // All statuses
        queryBuilder.andWhere(`(
          (job.status = '${Status.COMPLETED}' AND job.start_date IS NOT NULL AND job.completed_date IS NOT NULL 
           AND job.start_date <= :endDate AND job.completed_date >= :startDate) OR
          (job.status = '${Status.PENDING}' AND job.due_date >= :startDate AND job.due_date <= :endDate) OR
          (job.status = '${Status.IN_PROGRESS}' AND job.start_date IS NOT NULL 
           AND job.start_date <= :endDate AND (job.completed_date IS NULL OR job.completed_date >= :startDate))
        )`, {
          startDate: startDateString,
          endDate: endDateString
        });
      }
    } else {
      // Exact date matching - different field based on status
      if (status) {
        // Filter for specific status
        if (status === Status.COMPLETED) {
          queryBuilder.andWhere(`job.status = :status AND job.start_date IS NOT NULL AND job.completed_date IS NOT NULL 
           AND job.start_date <= :exactDate AND job.completed_date >= :exactDate`, {
            status,
            exactDate: startDateString
          });
        } else if (status === Status.PENDING) {
          queryBuilder.andWhere(`job.status = :status AND job.due_date = :exactDate`, {
            status,
            exactDate: startDateString
          });
        } else if (status === Status.IN_PROGRESS) {
          queryBuilder.andWhere(`job.status = :status AND job.start_date IS NOT NULL 
           AND job.start_date <= :exactDate AND (job.completed_date IS NULL OR job.completed_date >= :exactDate)`, {
            status,
            exactDate: startDateString
          });
        }
      } else {
        // All statuses
        queryBuilder.andWhere(`(
          (job.status = '${Status.COMPLETED}' AND job.start_date IS NOT NULL AND job.completed_date IS NOT NULL 
           AND job.start_date <= :exactDate AND job.completed_date >= :exactDate) OR
          (job.status = '${Status.PENDING}' AND job.due_date = :exactDate) OR
          (job.status = '${Status.IN_PROGRESS}' AND job.start_date IS NOT NULL 
           AND job.start_date <= :exactDate AND (job.completed_date IS NULL OR job.completed_date >= :exactDate))
        )`, {
          exactDate: startDateString
        });
      }
    }

    return await queryBuilder
      .orderBy('job.due_date', 'ASC')
      .getMany();
  }

  async updateJob(id: number, updateData: Partial<Job>): Promise<Job | null> {
    try {
      // Convert dates to DD/MM/YYYY string format
      const processedData = { ...updateData };
      
      if (processedData.start_date) {
        processedData.start_date = this.dateToString(processedData.start_date);
      }
      
      if (processedData.due_date) {
        processedData.due_date = this.dateToString(processedData.due_date);
      }

      if (processedData.completed_date) {
        processedData.completed_date = this.dateToString(processedData.completed_date);
      }

      const result = await this.jobRepository
        .createQueryBuilder()
        .update(Job)
        .set({
          title: processedData.title,
          description: processedData.description,
          status: processedData.status,
          price: processedData.price,
          client: processedData.client,
          due_date: processedData.due_date,
          start_date: processedData.start_date,
          completed_date: processedData.completed_date
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