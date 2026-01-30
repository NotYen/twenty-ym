import { Test, type TestingModule } from '@nestjs/testing';

import {
  ShareLinkErrorCode,
  ShareLinkValidationService,
} from '../share-link-validation.service';
import { ShareLinkService } from '../share-link.service';

describe('ShareLinkValidationService', () => {
  let service: ShareLinkValidationService;
  let shareLinkService: jest.Mocked<ShareLinkService>;

  beforeEach(async () => {
    const mockShareLinkService = {
      findByToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareLinkValidationService,
        {
          provide: ShareLinkService,
          useValue: mockShareLinkService,
        },
      ],
    }).compile();

    service = module.get<ShareLinkValidationService>(
      ShareLinkValidationService,
    );
    shareLinkService = module.get(ShareLinkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateShareLink', () => {
    it('should return invalid for malformed token', async () => {
      const result = await service.validateShareLink('');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ShareLinkErrorCode.INVALID_TOKEN);
    });

    it('should return invalid for non-existent token', async () => {
      shareLinkService.findByToken.mockResolvedValue(null);

      const result = await service.validateShareLink('valid-format-token');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ShareLinkErrorCode.LINK_NOT_FOUND);
    });

    it('should return invalid for disabled link', async () => {
      const mockShareLink = {
        id: 'test-id',
        token: 'test-token',
        isActive: false,
        expiresAt: null,
        inactivityExpirationDays: null,
        createdAt: new Date(),
        lastAccessedAt: null,
      };

      shareLinkService.findByToken.mockResolvedValue(mockShareLink as any);

      const result = await service.validateShareLink('test-token');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ShareLinkErrorCode.LINK_DISABLED);
    });

    it('should return invalid for expired link', async () => {
      const pastDate = new Date();

      pastDate.setDate(pastDate.getDate() - 1);

      const mockShareLink = {
        id: 'test-id',
        token: 'test-token',
        isActive: true,
        expiresAt: pastDate,
        inactivityExpirationDays: null,
        createdAt: new Date(),
        lastAccessedAt: null,
      };

      shareLinkService.findByToken.mockResolvedValue(mockShareLink as any);

      const result = await service.validateShareLink('test-token');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ShareLinkErrorCode.LINK_EXPIRED);
    });

    it('should return invalid for inactivity expired link', async () => {
      const oldDate = new Date();

      oldDate.setDate(oldDate.getDate() - 10);

      const mockShareLink = {
        id: 'test-id',
        token: 'test-token',
        isActive: true,
        expiresAt: null,
        inactivityExpirationDays: 7,
        createdAt: oldDate,
        lastAccessedAt: null,
      };

      shareLinkService.findByToken.mockResolvedValue(mockShareLink as any);

      const result = await service.validateShareLink('test-token');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ShareLinkErrorCode.LINK_INACTIVE_EXPIRED);
    });

    it('should return valid for active link', async () => {
      const mockShareLink = {
        id: 'test-id',
        token: 'test-token',
        isActive: true,
        expiresAt: null,
        inactivityExpirationDays: null,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
      };

      shareLinkService.findByToken.mockResolvedValue(mockShareLink as any);

      const result = await service.validateShareLink('test-token');

      expect(result.isValid).toBe(true);
      expect(result.shareLink).toBeDefined();
    });
  });

  describe('isAuthenticationRequired', () => {
    it('should return true for LOGIN_REQUIRED access mode', () => {
      const shareLink = {
        accessMode: 'LOGIN_REQUIRED',
      } as any;

      const result = service.isAuthenticationRequired(shareLink);

      expect(result).toBe(true);
    });

    it('should return false for PUBLIC access mode', () => {
      const shareLink = {
        accessMode: 'PUBLIC',
      } as any;

      const result = service.isAuthenticationRequired(shareLink);

      expect(result).toBe(false);
    });
  });
});
