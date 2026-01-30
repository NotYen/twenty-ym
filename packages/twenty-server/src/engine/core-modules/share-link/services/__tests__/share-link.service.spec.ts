import { Test, type TestingModule } from '@nestjs/testing';

import { ShareLinkRepository } from '../../repositories/share-link.repository';
import { ShareLinkService } from '../share-link.service';

describe('ShareLinkService', () => {
  let service: ShareLinkService;
  let repository: jest.Mocked<ShareLinkRepository>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareLinkService,
        {
          provide: ShareLinkRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ShareLinkService>(ShareLinkService);
    repository = module.get(ShareLinkRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createShareLink', () => {
    it('should create a share link with secure token', async () => {
      const mockShareLink = {
        id: 'test-id',
        token: 'secure-token',
        resourceType: 'COMPANY',
        resourceId: 'company-id',
        accessMode: 'PUBLIC',
        isActive: true,
        expiresAt: null,
        inactivityExpirationDays: null,
        accessCount: 0,
        lastAccessedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-id',
      };

      repository.findOne.mockResolvedValue(null); // Token is unique
      repository.create.mockResolvedValue(mockShareLink as any);

      const input = {
        resourceType: 'COMPANY' as const,
        resourceId: 'company-id',
        accessMode: 'PUBLIC' as const,
        workspaceId: 'workspace-id',
        createdById: 'user-id',
      };

      const result = await service.createShareLink(input);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.resourceType).toBe('COMPANY');
      expect(result.accessMode).toBe('PUBLIC');
      expect(repository.create).toHaveBeenCalled();
    });

    it('should generate unique tokens', async () => {
      // 模擬第一次 token 已存在，第二次唯一
      repository.findOne
        .mockResolvedValueOnce({ token: 'existing-token' } as any)
        .mockResolvedValueOnce(null);

      repository.create.mockResolvedValue({
        id: 'test-id',
        token: 'unique-token',
        resourceType: 'COMPANY',
        resourceId: 'company-id',
        accessMode: 'PUBLIC',
        isActive: true,
        expiresAt: null,
        inactivityExpirationDays: null,
        accessCount: 0,
        lastAccessedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: 'user-id',
      } as any);

      const input = {
        resourceType: 'COMPANY' as const,
        resourceId: 'company-id',
        accessMode: 'PUBLIC' as const,
        workspaceId: 'workspace-id',
        createdById: 'user-id',
      };

      const result = await service.createShareLink(input);

      expect(result).toBeDefined();
      expect(repository.findOne).toHaveBeenCalledTimes(2); // 檢查唯一性
    });
  });

  describe('findShareLinksByUser', () => {
    it('should return user share links', async () => {
      const mockShareLinks = [
        {
          id: 'test-id-1',
          token: 'token-1',
          resourceType: 'COMPANY',
          createdById: 'user-id',
        },
        {
          id: 'test-id-2',
          token: 'token-2',
          resourceType: 'PERSON',
          createdById: 'user-id',
        },
      ];

      repository.find.mockResolvedValue(mockShareLinks as any);

      const result = await service.findShareLinksByUser({
        workspaceId: 'workspace-id',
        userId: 'user-id',
      });

      expect(result).toHaveLength(2);
      expect(repository.find).toHaveBeenCalledWith({
        where: { createdById: 'user-id' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('trackAccess', () => {
    it('should increment access count and update last accessed time', async () => {
      const mockShareLink = {
        id: 'test-id',
        token: 'test-token',
        accessCount: 5,
      };

      repository.findOne.mockResolvedValue(mockShareLink as any);
      repository.update.mockResolvedValue({} as any);

      await service.trackAccess('test-token');

      expect(repository.update).toHaveBeenCalledWith('test-id', {
        accessCount: 6,
        lastAccessedAt: expect.any(Date),
      });
    });
  });
});
