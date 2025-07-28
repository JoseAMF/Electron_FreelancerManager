import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { OrmDatabaseService } from '../database/orm-database.service';

export class PaymentService {
  private paymentRepository: Repository<Payment>;

  constructor(private dbService: OrmDatabaseService) {
    this.paymentRepository = this.dbService.getDataSource().getRepository(Payment);
  }

  async createPayment(paymentData: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentRepository.create(paymentData);
    return await this.paymentRepository.save(payment);
  }

  async getAllPayments(): Promise<Payment[]> {
    return await this.paymentRepository.find({
      relations: ['job', 'attachments'],
      order: { created_at: 'DESC' }
    });
  }

  async getPaymentById(id: number): Promise<Payment | null> {
    return await this.paymentRepository.findOne({
      where: { id },
      relations: ['job', 'attachments']
    });
  }

  async getPaymentsByJob(jobId: number): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { job: { id: jobId } },
      relations: ['job', 'attachments'],
      order: { created_at: 'DESC' }
    });
  }

  async getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.job', 'job')
      .leftJoinAndSelect('payment.attachments', 'attachments')
      .where('payment.created_at >= :startDate AND payment.created_at <= :endDate', {
        startDate,
        endDate
      })
      .orderBy('payment.created_at', 'DESC')
      .getMany();
  }

  async updatePayment(id: number, updateData: Partial<Payment>): Promise<Payment | null> {
    await this.paymentRepository.update(id, updateData);
    return await this.getPaymentById(id);
  }

  async deletePayment(id: number): Promise<boolean> {
    const result = await this.paymentRepository.delete(id);
    return result.affected != undefined && result.affected > 0;
  }

  async getTotalPayments(): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .getRawOne();
    
    return parseFloat(result.total) || 0;
  }

  async getPaymentsByMonth(year: number, month: number): Promise<Payment[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return await this.getPaymentsByDateRange(startDate, endDate);
  }

  async getPaymentStats(): Promise<any> {
    const totalAmount = await this.getTotalPayments();
    const totalCount = await this.paymentRepository.count();
    
    const thisMonth = new Date();
    const monthlyPayments = await this.getPaymentsByMonth(
      thisMonth.getFullYear(), 
      thisMonth.getMonth() + 1
    );
    
    const monthlyAmount = monthlyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    return {
      totalAmount,
      totalCount,
      monthlyAmount,
      monthlyCount: monthlyPayments.length
    };
  }
}