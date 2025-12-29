import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SuperAdminEntity } from 'src/engine/core-modules/super-admin/super-admin.entity';
import { SuperAdminResolver } from 'src/engine/core-modules/super-admin/super-admin.resolver';
import { SuperAdminService } from 'src/engine/core-modules/super-admin/super-admin.service';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SuperAdminEntity, UserEntity])],
  providers: [SuperAdminService, SuperAdminResolver],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
