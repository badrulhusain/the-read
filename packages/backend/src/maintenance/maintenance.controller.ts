import {
  Controller,
  Get,
  Headers,
  Header,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { timingSafeEqual } from 'node:crypto';
import { Public } from '../common/decorators/public.decorator';
import { AdminService } from '../admin/admin.service';
import { MediaCleanupService } from '../uploads/media-cleanup.service';

@Controller('internal')
export class MaintenanceController {
  constructor(
    private readonly admin: AdminService,
    private readonly cleanup: MediaCleanupService,
  ) {}

  @Public()
  @SkipThrottle()
  @Get('maintenance')
  @Header('Cache-Control', 'private, no-store')
  async run(@Headers('authorization') authorization?: string) {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException(
        'Scheduled jobs are not configured',
      );
    }
    const expected = Buffer.from(`Bearer ${secret}`);
    const received = Buffer.from(authorization ?? '');
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      throw new UnauthorizedException();
    }
    // Both jobs finish before the function responds; no work is left in a timer.
    const results = await Promise.allSettled([
      this.admin.publishDue(),
      this.cleanup.processDue(),
    ]);
    if (results.some((result) => result.status === 'rejected')) {
      throw new ServiceUnavailableException('Scheduled maintenance failed');
    }
    const publication = results[0];
    return {
      status: 'ok',
      publication:
        publication.status === 'fulfilled' ? publication.value : null,
    };
  }
}
