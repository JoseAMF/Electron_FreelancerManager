import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from "./base.entity";
import { Job } from "./job.entity";

@Entity('clients')
export class Client extends BaseEntity {
    @Column()
    name!: string;

    @Column()
    email!: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true })
    discord?: string;

    @OneToMany(() => Job, job => job.client)
    jobs?: Job[];
}