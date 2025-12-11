import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceConfigEntity } from 'src/engine/core-modules/workspace-config/workspace-config.entity';

@Injectable()
export class WorkspaceConfigService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey: Buffer;

  constructor(
    @InjectRepository(WorkspaceConfigEntity)
    private readonly workspaceConfigRepository: Repository<WorkspaceConfigEntity>,
    private readonly twentyConfigService: TwentyConfigService,
  ) {
    const appSecret = this.twentyConfigService.get('APP_SECRET');
    if (!appSecret) {
      throw new Error('APP_SECRET is not defined');
    }
    // Ensure the key is 32 bytes
    this.secretKey = createHash('sha256').update(appSecret).digest();
  }

  async get(workspaceId: string, key: string, defaultValue?: string): Promise<string | null> {
    const config = await this.workspaceConfigRepository.findOne({
      where: { workspaceId, key },
    });

    if (!config) {
      return defaultValue ?? null;
    }

    try {
      return this.decrypt(config.value);
    } catch (error) {
        console.error(`Failed to decrypt config value for key ${key} in workspace ${workspaceId}`, error);
        return null;
    }
  }

  async getAll(workspaceId: string): Promise<{ key: string; value: string; valueType: string }[]> {
    const configs = await this.workspaceConfigRepository.find({
      where: { workspaceId },
    });

    return configs.map((config) => {
      try {
        return {
          key: config.key,
          value: this.decrypt(config.value),
          valueType: config.valueType,
        };
      } catch (error) {
        console.error(`Failed to decrypt config value for key ${config.key} in workspace ${workspaceId}`, error);
        return {
          key: config.key,
          value: '', // Return empty if decryption fails to avoid breaking UI
          valueType: config.valueType,
        };
      }
    });
  }

  async set(workspaceId: string, key: string, value: string, valueType: string = 'string'): Promise<void> {
    const encryptedValue = this.encrypt(value);

    // Upsert logic
    const existingConfig = await this.workspaceConfigRepository.findOne({
      where: { workspaceId, key },
    });

    if (existingConfig) {
      existingConfig.value = encryptedValue;
      existingConfig.valueType = valueType;
      await this.workspaceConfigRepository.save(existingConfig);
    } else {
      await this.workspaceConfigRepository.save({
        workspaceId,
        key,
        value: encryptedValue,
        valueType,
      });
    }
  }

  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.secretKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(text: string): string {
    const textParts = text.split(':');
    const ivHex = textParts.shift();
    if (!ivHex) throw new Error('Invalid encrypted text format');

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv(this.algorithm, this.secretKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
