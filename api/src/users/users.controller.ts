import {
  Controller,
  UseGuards,
  Get,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserInSession } from '../global.entity';
import { Logger } from '@nestjs/common';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Get('/me')
  async getUser(@CurrentUser() user: UserInSession) {
    this.logger.log('getUser called with user:', user);
    try {
      const dbUser = await this.usersService.findUserByAddress(
        user.parsedJWT.sub.toLowerCase(),
      );
      if (!dbUser) {
        throw new HttpException('User not found', 404);
      }
      return dbUser;
    } catch (error) {
      console.log('Error in getUser', error);
      throw new HttpException('Failed to fetch user', 500);
    }
  }

  // @Get('/list')
  // async listUsers(@CurrentUser() user: UserInSession) {
  //   try {
  //     const dbUser = await this.usersService.findUserByAddress(
  //       user.parsedJWT.sub,
  //     );
  //     if (!dbUser) {
  //       throw new HttpException('User not found', 404);
  //     }
  //     if (!dbUser.isSuperuser) {
  //       throw new UnauthorizedException('Only superAdmin can access user list');
  //     }
  //     return await this.usersService.users({});
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new HttpException('Failed to fetch users list', 500);
  //   }
  // }
}
