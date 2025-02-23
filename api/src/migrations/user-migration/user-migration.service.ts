import { OnModuleInit, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
// import * as UserjsonData from "../backups/data.json";
import { UsersService } from 'src/users/users.service';

@Injectable()
export class UserMigrationService {
  constructor(private usersService: UsersService) {}
  // each migration should have a description of what it does

  async migrate() {
    await this.migration001();
  }

  async migration001() {
    // console.log(`Found ${UserjsonData.length} users to migrate`)
    // for (const user of UserjsonData) {
    //     const walletSetId = user.wallet_set_id;
    //     if (walletSetId) {
    //         console.log(`Migrating user with walletSetId: ${walletSetId}`)
    //         await this.usersService.createUser({
    //             walletSetId: walletSetId,
    //             address: user.user_address,
    //         })
    //     }
    // }
    // this migration will migrate the user data from the old database to the new database, creates user with the same walletSetId as in DATA v1
  }
}
