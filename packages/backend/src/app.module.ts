import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BlogsModule } from './blogs/blogs.module';
import { EditorialModule } from './editorial/editorial.module';
import { AdminModule } from './admin/admin.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CommentsModule } from './comments/comments.module';
import { UploadsModule } from './uploads/uploads.module';
import { HealthModule } from './health/health.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { ReaderModule } from './reader/reader.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { PublicReadCache } from './common/cache/public-read-cache';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuditLogModule,
    AuthModule,
    UsersModule,
    BlogsModule,
    EditorialModule,
    AdminModule,
    CategoriesModule,
    TagsModule,
    DashboardModule,
    CommentsModule,
    UploadsModule,
    HealthModule,
    SubmissionsModule,
    ReaderModule,
    DiscoveryModule,
    MaintenanceModule,
  ],
  providers: [
    PublicReadCache,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
