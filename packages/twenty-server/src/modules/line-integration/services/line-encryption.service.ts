import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * LINE Encryption Service
 *
 * 提供 AES-256-GCM 加密/解密功能
 *
 * 加密格式：iv:authTag:encryptedData (全部 base64 編碼)
 * - iv: 初始化向量 (16 bytes)
 * - authTag: 驗證標籤 (16 bytes)
 * - encryptedData: 加密後的資料
 *
 * 安全性：
 * - 每次加密使用不同的 IV (初始化向量)
 * - 使用 GCM 模式確保資料完整性
 * - Master Key 從環境變數取得，不硬編碼
 */
@Injectable()
export class LineEncryptionService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 16; // 16 bytes for AES
  private readonly AUTH_TAG_LENGTH = 16;
  private readonly masterKey: Buffer;

  constructor() {
    const key = process.env.LINE_CONFIG_ENCRYPTION_KEY;

    if (!key) {
      throw new Error(
        'LINE_CONFIG_ENCRYPTION_KEY environment variable is not set',
      );
    }

    // 將 hex 字串轉換為 Buffer (32 bytes for AES-256)
    // 如果環境變數是 base64，使用: Buffer.from(key, 'base64')
    // 如果環境變數是 hex，使用: Buffer.from(key, 'hex')
    this.masterKey = Buffer.from(key, 'hex');

    if (this.masterKey.length !== 32) {
      throw new Error(
        `LINE_CONFIG_ENCRYPTION_KEY must be 32 bytes (64 hex characters), got ${this.masterKey.length} bytes`,
      );
    }
  }

  /**
   * 加密資料
   * @param plaintext - 明文
   * @returns 加密後的資料 (格式: iv:authTag:encryptedData)
   */
  encrypt(plaintext: string): string {
    // 產生隨機 IV
    const iv = randomBytes(this.IV_LENGTH);

    // 建立 cipher
    const cipher = createCipheriv(this.ALGORITHM, this.masterKey, iv);

    // 加密資料
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // 取得驗證標籤
    const authTag = cipher.getAuthTag();

    // 組合結果: iv:authTag:encryptedData
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted,
    ].join(':');
  }

  /**
   * 解密資料
   * @param encrypted - 加密後的資料 (格式: iv:authTag:encryptedData)
   * @returns 明文
   */
  decrypt(encrypted: string): string {
    try {
      // 解析加密字串
      const parts = encrypted.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivBase64, authTagBase64, encryptedData] = parts;
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // 建立 decipher
      const decipher = createDecipheriv(this.ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(authTag);

      // 解密資料
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * 產生新的加密金鑰 (用於初始化)
   * 這是一個工具方法，不應在正常流程中使用
   */
  static generateKey(): string {
    return randomBytes(32).toString('hex');
  }
}
