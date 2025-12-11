import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';
import { MicrosoftStrategy } from '../microsoft.auth.strategy';

describe('MicrosoftStrategy', () => {
  let microsoftStrategy: MicrosoftStrategy;
  let twentyConfigService: TwentyConfigService;
  let workspaceConfigService: WorkspaceConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MicrosoftStrategy,
        {
          provide: TwentyConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AUTH_MICROSOFT_CLIENT_ID') return 'global-client-id';
              if (key === 'AUTH_MICROSOFT_CLIENT_SECRET') return 'global-client-secret';
              if (key === 'AUTH_MICROSOFT_CALLBACK_URL') return 'http://localhost/callback';
              return null;
            }),
          },
        },
        {
          provide: WorkspaceConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    microsoftStrategy = module.get<MicrosoftStrategy>(MicrosoftStrategy);
    twentyConfigService = module.get<TwentyConfigService>(TwentyConfigService);
    workspaceConfigService = module.get<WorkspaceConfigService>(WorkspaceConfigService);


    // Mock Passport methods needed for super.authenticate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (microsoftStrategy as any).redirect = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (microsoftStrategy as any).success = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (microsoftStrategy as any).fail = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (microsoftStrategy as any).error = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (microsoftStrategy as any).pass = jest.fn();
  });

  it('should be defined', () => {
    expect(microsoftStrategy).toBeDefined();
  });

  describe('authenticate', () => {
    it('should use global config when no workspaceId is present', async () => {
      const req = {
        params: { workspaceId: undefined },
        query: {},
      } as unknown as Request;

      const superAuthenticateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(microsoftStrategy)), 'authenticate');

      await microsoftStrategy.authenticate(req, {});

      expect(workspaceConfigService.get).not.toHaveBeenCalled();
      expect(superAuthenticateSpy).toHaveBeenCalled();
    });

    it('should use global config when workspace config is missing', async () => {
      const req = {
        params: { workspaceId: 'ws-1' },
        query: {},
      } as unknown as Request;

      jest.spyOn(workspaceConfigService, 'get').mockResolvedValue(null);
      const superAuthenticateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(microsoftStrategy)), 'authenticate');

      await microsoftStrategy.authenticate(req, {});

      expect(workspaceConfigService.get).toHaveBeenCalledWith('ws-1', 'AUTH_MICROSOFT_CLIENT_ID');
      expect(superAuthenticateSpy).toHaveBeenCalled();
    });

    it('should attempt to fetch workspace config when workspaceId is present', async () => {
       const req = {
        params: { workspaceId: 'ws-1' },
        query: {},
      } as unknown as Request;

      jest.spyOn(workspaceConfigService, 'get').mockResolvedValue('custom-value');

      try {
        await microsoftStrategy.authenticate(req, {});
      } catch (e) {
        // Expected to fail as we didn't mock the inner Strategy or its authenticate
      }

      expect(workspaceConfigService.get).toHaveBeenCalledWith('ws-1', 'AUTH_MICROSOFT_CLIENT_ID');
      expect(workspaceConfigService.get).toHaveBeenCalledWith('ws-1', 'AUTH_MICROSOFT_CLIENT_SECRET');
    });
  });
});
