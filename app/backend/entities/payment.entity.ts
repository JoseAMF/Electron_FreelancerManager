import { Entity, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from "./base.entity";
import { Job } from "./job.entity";
import { Attachment } from "./attachment.entity";

@Entity('payments')
export class Payment extends BaseEntity {
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @OneToOne(() => Attachment, attachment => attachment.payment, { nullable: true })
    @JoinColumn({ name: 'attachment_id' })
    attachment?: Attachment;

    @Column()
    date!: Date;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @ManyToOne(() => Job, job => job.payments, { nullable: true })
    @JoinColumn({ name: 'job_id' })
    job?: Job;
}