import { Injectable, Logger } from '@nestjs/common';

import { LessThan } from 'typeorm';

import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';

type CleanupInput = {
  workspaceId: string;
  retentionDays: number;
};

@Injectable()
export class TimelineCleanupService {
  private readonly logger = new Logger(TimelineCleanupService.name);

  constructor(
    private readonly twentyORMGlobalManager: TwentyORMGlobalManager,
  ) {}

  async cleanupWorkspaceTimeline({
    workspaceId,
    retentionDays,
  }: CleanupInput): Promise<number> {
    if (retentionDays <= 0) {
      this.logger.warn(
        `Retention days must be positive. Skipping cleanup for workspace ${workspaceId}.`,
      );

      return 0;
    }

    const repository =
      await this.twentyORMGlobalManager.getRepositoryForWorkspace(
        workspaceId,
        'timelineActivity',
        { shouldBypassPermissionChecks: true },
      );

    const cutoffDate = this.calculateCutoffDate(retentionDays);

    const result = await repository.delete({
      happensAt: LessThan(cutoffDate),
    });

    const affected = result.affected ?? 0;

    if (affected > 0) {
      this.logger.log(
        `Deleted ${affected} timeline activity record(s) older than ${cutoffDate.toISOString()} for workspace ${workspaceId}`,
      );
    }

    return affected;
  }

  private calculateCutoffDate(retentionDays: number): Date {
    const cutoffDate = new Date();

    cutoffDate.setUTCHours(0, 0, 0, 0);
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - retentionDays);

    return cutoffDate;
  }
}
