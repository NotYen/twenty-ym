import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';
import { WorkspaceConfigEntity } from 'src/engine/core-modules/workspace-config/workspace-config.entity';
import { WorkspaceConfigResolver } from 'src/engine/core-modules/workspace-config/workspace-config.resolver';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceConfigEntity]),
    TwentyConfigModule,
    PermissionsModule,
  ],
  providers: [WorkspaceConfigService, WorkspaceConfigResolver],
  exports: [WorkspaceConfigService],
})
export class WorkspaceConfigModule {}
