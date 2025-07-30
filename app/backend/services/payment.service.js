"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const payment_entity_1 = require("../entities/payment.entity");
const attachment_entity_1 = require("../entities/attachment.entity");
const attachment_service_1 = require("./attachment.service");
class PaymentService {
    constructor(dbService) {
        this.dbService = dbService;
        this.paymentRepository = this.dbService.getDataSource().getRepository(payment_entity_1.Payment);
        this.attachmentRepository = this.dbService.getDataSource().getRepository(attachment_entity_1.Attachment);
        this.attachmentService = new attachment_service_1.AttachmentService(dbService);
    }
    createPayment(paymentData) {
        return __awaiter(this, void 0, void 0, function* () {
            const payment = this.paymentRepository.create(paymentData);
            return yield this.paymentRepository.save(payment);
        });
    }
    getAllPayments() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.paymentRepository.find({
                relations: ['job', 'attachments'],
                order: { created_at: 'DESC' }
            });
        });
    }
    getPaymentById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.paymentRepository.findOne({
                where: { id },
                relations: ['job', 'attachments']
            });
        });
    }
    getPaymentsByJob(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.paymentRepository.find({
                where: { job: { id: jobId } },
                relations: ['job', 'attachments'],
                order: { created_at: 'DESC' }
            });
        });
    }
    getPaymentsByDateRange(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.paymentRepository
                .createQueryBuilder('payment')
                .leftJoinAndSelect('payment.job', 'job')
                .leftJoinAndSelect('payment.attachments', 'attachments')
                .where('payment.created_at >= :startDate AND payment.created_at <= :endDate', {
                startDate,
                endDate
            })
                .orderBy('payment.created_at', 'DESC')
                .getMany();
        });
    }
    updatePayment(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.paymentRepository.update(id, updateData);
            return yield this.getPaymentById(id);
        });
    }
    deletePayment(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // First, get all attachments associated with this payment
                const attachments = yield this.attachmentRepository.find({
                    where: { payment: { id } }
                });
                // Delete each attachment (this will handle both DB and file deletion)
                for (const attachment of attachments) {
                    try {
                        yield this.attachmentService.deleteAttachment(attachment.id);
                    }
                    catch (error) {
                        console.error('Error deleting attachment:', error);
                        // Continue with other attachments even if one fails
                    }
                }
                // Then delete the payment
                const result = yield this.paymentRepository.delete(id);
                return result.affected != undefined && result.affected > 0;
            }
            catch (error) {
                console.error('Error deleting payment:', error);
                return false;
            }
        });
    }
    getTotalPayments() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.paymentRepository
                .createQueryBuilder('payment')
                .select('SUM(payment.amount)', 'total')
                .getRawOne();
            return parseFloat(result.total) || 0;
        });
    }
    getPaymentsByMonth(year, month) {
        return __awaiter(this, void 0, void 0, function* () {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            return yield this.getPaymentsByDateRange(startDate, endDate);
        });
    }
    getPaymentStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const totalAmount = yield this.getTotalPayments();
            const totalCount = yield this.paymentRepository.count();
            const thisMonth = new Date();
            const monthlyPayments = yield this.getPaymentsByMonth(thisMonth.getFullYear(), thisMonth.getMonth() + 1);
            const monthlyAmount = monthlyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
            return {
                totalAmount,
                totalCount,
                monthlyAmount,
                monthlyCount: monthlyPayments.length
            };
        });
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map