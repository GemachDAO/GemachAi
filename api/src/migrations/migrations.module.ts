import { Module, OnModuleInit } from '@nestjs/common';
import { UserMigrationService } from './user-migration/user-migration.service';

@Module({
  providers: [UserMigrationService],
  exports: [UserMigrationService],
})
export class MigrationsModule implements OnModuleInit {
  constructor(private userMigrationService: UserMigrationService) {}
  async onModuleInit() {
    // await this.userMigrationService.migrate();
  }
}
