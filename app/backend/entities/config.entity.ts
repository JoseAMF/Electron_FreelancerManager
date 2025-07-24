import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('config')
export class Config {
    @PrimaryColumn()
    key!: string;

    @Column()
    value!: string;

    // Helper method to get typed values
    static getAttachmentsPath(configs: Config[]): string {
        const config = configs.find(c => c.key === 'attachmentsPath');
        return config?.value || './attachments';
    }
}