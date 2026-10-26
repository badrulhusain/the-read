import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { UploadsModule } from '../uploads/uploads.module';
import { MaintenanceController } from './maintenance.controller';

@Module({
  imports: [AdminModule, UploadsModule],
  controllers: [MaintenanceController],
})
export class MaintenanceModule {}
