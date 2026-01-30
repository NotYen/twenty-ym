import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FindOptionsWhere, Repository } from 'typeorm';

import { ShareLinkEntity } from 'src/engine/core-modules/share-link/entities/share-link.entity';

@Injectable()
export class ShareLinkRepository {
  constructor(
    @InjectRepository(ShareLinkEntity)
    private readonly shareLinkRepository: Repository<ShareLinkEntity>,
  ) {}

  async create(data: Partial<ShareLinkEntity>): Promise<ShareLinkEntity> {
    return this.shareLinkRepository.save(data);
  }

  async findOne(options: {
    where: FindOptionsWhere<ShareLinkEntity>;
  }): Promise<ShareLinkEntity | null> {
    return this.shareLinkRepository.findOne(options);
  }

  async find(options: {
    where?: FindOptionsWhere<ShareLinkEntity>;
    order?: Record<string, 'ASC' | 'DESC'>;
  }): Promise<ShareLinkEntity[]> {
    return this.shareLinkRepository.find(options);
  }

  async update(
    id: string,
    data: Partial<ShareLinkEntity>,
  ): Promise<ShareLinkEntity> {
    await this.shareLinkRepository.update(id, data);
    const updated = await this.shareLinkRepository.findOne({
      where: { id } as any,
    });

    if (!updated) {
      throw new Error('Share link not found after update');
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.shareLinkRepository.delete(id);
  }

  async findActiveLinks(): Promise<ShareLinkEntity[]> {
    return this.shareLinkRepository.find({
      where: { isActive: true },
    });
  }

  async findExpiredLinks(): Promise<ShareLinkEntity[]> {
    const now = new Date();

    return this.shareLinkRepository
      .createQueryBuilder('shareLink')
      .where('shareLink.isActive = :isActive', { isActive: true })
      .andWhere(
        '(shareLink.expiresAt IS NOT NULL AND shareLink.expiresAt < :now)',
        { now },
      )
      .getMany();
  }

  async findInactiveExpiredLinks(
    inactivityDays: number,
  ): Promise<ShareLinkEntity[]> {
    const cutoffDate = new Date();

    cutoffDate.setDate(cutoffDate.getDate() - inactivityDays);

    return this.shareLinkRepository
      .createQueryBuilder('shareLink')
      .where('shareLink.isActive = :isActive', { isActive: true })
      .andWhere(
        'shareLink.inactivityExpirationDays IS NOT NULL AND shareLink.inactivityExpirationDays = :inactivityDays',
        { inactivityDays },
      )
      .andWhere(
        '(shareLink.lastAccessedAt IS NULL AND shareLink.createdAt < :cutoffDate) OR shareLink.lastAccessedAt < :cutoffDate',
        { cutoffDate },
      )
      .getMany();
  }
}
