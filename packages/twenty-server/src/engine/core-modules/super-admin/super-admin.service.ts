import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { SuperAdminDTO } from 'src/engine/core-modules/super-admin/dtos/super-admin.dto';
import { SuperAdminEntity } from 'src/engine/core-modules/super-admin/super-admin.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  // Primary Super Admin email - hardcoded for security
  private readonly PRIMARY_SUPER_ADMIN_EMAIL = 'notyenyu@gmail.com';

  constructor(
    @InjectRepository(SuperAdminEntity)
    private readonly superAdminRepository: Repository<SuperAdminEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Check if the given email is the Primary Super Admin
   */
  isPrimarySuperAdmin(email: string): boolean {
    return email.toLowerCase() === this.PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase();
  }

  /**
   * Check if the given email is a Super Admin (including Primary)
   */
  async isSuperAdmin(email: string): Promise<boolean> {
    // Primary Super Admin is always a Super Admin
    if (this.isPrimarySuperAdmin(email)) {
      return true;
    }

    // Check database for other Super Admins
    const superAdmin = await this.superAdminRepository.findOne({
      where: { userEmail: email.toLowerCase() },
    });

    return !!superAdmin;
  }

  /**
   * Get all Super Admins including the Primary
   */
  async getSuperAdmins(): Promise<SuperAdminDTO[]> {
    const superAdmins = await this.superAdminRepository.find({
      order: { createdAt: 'ASC' },
    });

    // Convert to DTOs and add isPrimary flag
    const result: SuperAdminDTO[] = superAdmins.map((sa) => ({
      id: sa.id,
      userEmail: sa.userEmail,
      grantedBy: sa.grantedBy,
      grantedAt: sa.grantedAt,
      isPrimary: false,
      createdAt: sa.createdAt,
      updatedAt: sa.updatedAt,
    }));

    // Add Primary Super Admin at the beginning if not already in the list
    const primaryExists = result.some(
      (sa) => sa.userEmail.toLowerCase() === this.PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase()
    );

    if (!primaryExists) {
      result.unshift({
        id: 'primary',
        userEmail: this.PRIMARY_SUPER_ADMIN_EMAIL,
        grantedBy: 'System',
        grantedAt: new Date('2024-01-01'), // System default date
        isPrimary: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
    } else {
      // Mark the existing Primary as isPrimary
      const primaryIndex = result.findIndex(
        (sa) => sa.userEmail.toLowerCase() === this.PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase()
      );
      if (primaryIndex !== -1) {
        result[primaryIndex].isPrimary = true;
      }
    }

    return result;
  }

  /**
   * Add a new Super Admin
   * Only Primary Super Admin can perform this action
   */
  async addSuperAdmin(
    userEmail: string,
    grantedByEmail: string,
  ): Promise<SuperAdminDTO> {
    const normalizedEmail = userEmail.toLowerCase();
    const normalizedGrantedBy = grantedByEmail.toLowerCase();

    // Check if requester is Primary Super Admin
    if (!this.isPrimarySuperAdmin(normalizedGrantedBy)) {
      throw new ForbiddenException('Only Primary Super Admin can add Super Admins');
    }

    // Check if user exists in the system
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException(
        `User with email "${userEmail}" does not exist. Please add the user first in Members settings.`
      );
    }

    // Check if already a Super Admin
    const existingSuperAdmin = await this.superAdminRepository.findOne({
      where: { userEmail: normalizedEmail },
    });

    if (existingSuperAdmin) {
      throw new BadRequestException(`User "${userEmail}" is already a Super Admin`);
    }

    // Cannot add Primary Super Admin (they are always Super Admin)
    if (this.isPrimarySuperAdmin(normalizedEmail)) {
      throw new BadRequestException('Primary Super Admin is already a Super Admin by default');
    }

    // Create new Super Admin record
    const newSuperAdmin = this.superAdminRepository.create({
      userEmail: normalizedEmail,
      grantedBy: normalizedGrantedBy,
      grantedAt: new Date(),
    });

    const saved = await this.superAdminRepository.save(newSuperAdmin);

    this.logger.log(`Super Admin added: ${normalizedEmail} by ${normalizedGrantedBy}`);

    return {
      id: saved.id,
      userEmail: saved.userEmail,
      grantedBy: saved.grantedBy,
      grantedAt: saved.grantedAt,
      isPrimary: false,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  /**
   * Remove a Super Admin
   * Only Primary Super Admin can perform this action
   */
  async removeSuperAdmin(
    userEmail: string,
    requestedByEmail: string,
  ): Promise<boolean> {
    const normalizedEmail = userEmail.toLowerCase();
    const normalizedRequestedBy = requestedByEmail.toLowerCase();

    // Check if requester is Primary Super Admin
    if (!this.isPrimarySuperAdmin(normalizedRequestedBy)) {
      throw new ForbiddenException('Only Primary Super Admin can remove Super Admins');
    }

    // Cannot remove Primary Super Admin
    if (this.isPrimarySuperAdmin(normalizedEmail)) {
      throw new BadRequestException('Cannot remove Primary Super Admin');
    }

    // Find and remove the Super Admin
    const superAdmin = await this.superAdminRepository.findOne({
      where: { userEmail: normalizedEmail },
    });

    if (!superAdmin) {
      throw new BadRequestException(`User "${userEmail}" is not a Super Admin`);
    }

    await this.superAdminRepository.remove(superAdmin);

    this.logger.log(`Super Admin removed: ${normalizedEmail} by ${normalizedRequestedBy}`);

    return true;
  }
}
