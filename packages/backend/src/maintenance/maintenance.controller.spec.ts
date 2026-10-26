import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { AdminService } from '../admin/admin.service';
import { MediaCleanupService } from '../uploads/media-cleanup.service';

describe('serverless maintenance', () => {
  const originalSecret = process.env.CRON_SECRET;
  const publishDue = jest.fn();
  const processDue = jest.fn();
  const controller = new MaintenanceController(
    { publishDue } as unknown as AdminService,
    { processDue } as unknown as MediaCleanupService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.CRON_SECRET = 'test-only-maintenance-secret';
    publishDue.mockResolvedValue({ processed: 1, published: 1 });
    processDue.mockResolvedValue(undefined);
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it.each([undefined, '', 'Bearer wrong', 'test-only-maintenance-secret'])(
    'rejects an unauthorized cron call (%s) before running any jobs',
    async (authorization) => {
      await expect(controller.run(authorization)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(publishDue).not.toHaveBeenCalled();
      expect(processDue).not.toHaveBeenCalled();
    },
  );

  it('fails closed when no secret is configured', async () => {
    delete process.env.CRON_SECRET;
    await expect(controller.run()).rejects.toThrow(ServiceUnavailableException);
    expect(publishDue).not.toHaveBeenCalled();
  });

  it('awaits both jobs before responding', async () => {
    const result = await controller.run('Bearer test-only-maintenance-secret');
    expect(result).toEqual({
      status: 'ok',
      publication: { processed: 1, published: 1 },
    });
    expect(processDue).toHaveBeenCalledTimes(1);
    expect(publishDue).toHaveBeenCalledTimes(1);
  });

  it('still runs cleanup and returns a failure when publication fails', async () => {
    publishDue.mockRejectedValue(new Error('Database unavailable'));
    await expect(
      controller.run('Bearer test-only-maintenance-secret'),
    ).rejects.toThrow(ServiceUnavailableException);
    expect(processDue).toHaveBeenCalledTimes(1);
  });
});
