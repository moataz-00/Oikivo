import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ConsultantEntity } from './consultant.entity';

@Entity('consultant_documents')
export class ConsultantDocumentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'consultant_id', type: 'bigint', unsigned: true })
  consultantId: number;

  @ManyToOne(() => ConsultantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_id' })
  consultant: ConsultantEntity;

  @Column({ name: 'document_type', type: 'enum', enum: ['hospitality_certificate', 'business_license', 'superhost_proof', 'portfolio', 'other', 'national_id', 'profile_photo'] })
  documentType: string;

  @Column({ name: 'file_url', length: 500 })
  fileUrl: string;

  @Column({ name: 'original_name', length: 255, nullable: true })
  originalName: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
