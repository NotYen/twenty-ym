import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceConfigService } from 'src/engine/core-modules/workspace-config/workspace-config.service';
import { GoogleStrategy } from '../google.auth.strategy';

describe('GoogleStrategy', () => {
  let googleStrategy: GoogleStrategy;
  let twentyConfigService: TwentyConfigService;
  let workspaceConfigService: WorkspaceConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: TwentyConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AUTH_GOOGLE_CLIENT_ID') return 'global-client-id';
              if (key === 'AUTH_GOOGLE_CLIENT_SECRET') return 'global-client-secret';
              if (key === 'AUTH_GOOGLE_CALLBACK_URL') return 'http://localhost/callback';
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

    googleStrategy = module.get<GoogleStrategy>(GoogleStrategy);
    twentyConfigService = module.get<TwentyConfigService>(TwentyConfigService);
    workspaceConfigService = module.get<WorkspaceConfigService>(WorkspaceConfigService);

    // Mock Passport methods needed for super.authenticate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (googleStrategy as any).redirect = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (googleStrategy as any).success = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (googleStrategy as any).fail = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (googleStrategy as any).error = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (googleStrategy as any).pass = jest.fn();
  });

  it('should be defined', () => {
    expect(googleStrategy).toBeDefined();
  });

  describe('authenticate', () => {
    it('should use global config when no workspaceId is present', async () => {
      const req = {
        params: {},
        query: {},
      } as unknown as Request;

      const superAuthenticateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(googleStrategy)), 'authenticate');

      await googleStrategy.authenticate(req, {});

      expect(workspaceConfigService.get).not.toHaveBeenCalled();
      expect(superAuthenticateSpy).toHaveBeenCalled();
    });

    it('should use global config when workspace config is missing', async () => {
      const req = {
        params: { workspaceId: 'ws-1' },
        query: {},
      } as unknown as Request;

      jest.spyOn(workspaceConfigService, 'get').mockResolvedValue(null);
      const superAuthenticateSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(googleStrategy)), 'authenticate');

      await googleStrategy.authenticate(req, {});

      expect(workspaceConfigService.get).toHaveBeenCalledWith('ws-1', 'AUTH_GOOGLE_CLIENT_ID');
      expect(superAuthenticateSpy).toHaveBeenCalled();
    });

    // Note: Testing the dynamic strategy creation deeply is hard because it's instantiated inside.
    // We can verify that workspaceConfigService is called.
    it('should attempt to fetch workspace config when workspaceId is present', async () => {
       const req = {
        params: { workspaceId: 'ws-1' },
        query: {},
      } as unknown as Request;

      jest.spyOn(workspaceConfigService, 'get').mockResolvedValue('custom-value');

      // We expect this to fail or throw because we are not mocking the dynamic strategy's authenticate method,
      // but we can check if it TRIED to get the config.
      try {
        await googleStrategy.authenticate(req, {});
      } catch (e) {
        // Expected to fail as we didn't mock the inner Strategy or its authenticate
      }

      expect(workspaceConfigService.get).toHaveBeenCalledWith('ws-1', 'AUTH_GOOGLE_CLIENT_ID');
      expect(workspaceConfigService.get).toHaveBeenCalledWith('ws-1', 'AUTH_GOOGLE_CLIENT_SECRET');
    });
  });
});
