import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet-set.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { UserInSession } from 'src/global.entity';
import { CustomLogger, Logger } from 'src/libs/logging';
// import { Erc20Value } from "@moralisweb3/common-evm-utils";
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(
    private walletsService: WalletsService,
    private usersService: UsersService,
    @Logger('WalletsController') private logger: CustomLogger,
  ) {}

  @Post('/create')
  async createWallet(
    @CurrentUser() user: UserInSession,
    @Body() createWalletDto: CreateWalletDto,
    @Res() res: Response,
  ) {
    try {
      // TODO: check if user has enough tokens to create a wallet and if user doest not already has wallets
      this.logger.log('Creating wallet');
      const dbUser = await this.usersService.findUserByAddress(
        user.parsedJWT.sub,
      );
      if (!dbUser) {
        throw new HttpException('User not found', 404);
      }
      let walletSetId = dbUser.walletSetId;

      if (walletSetId) {
        res.status(200).json({ message: 'Wallet already created' });
        return;
      }
      walletSetId = await this.walletsService.createWalletSet();
      await this.usersService.updateUser({
        where: { id: dbUser.id },
        data: { walletSetId },
      });

      const wallets = await this.walletsService.createWallet(walletSetId);
      console.log('wallets', wallets);
      const evmWalletAddress = wallets[0].address;
      const evmWalletId = wallets[0].id;

      await this.usersService.updateUser({
        where: { id: dbUser.id },
        data: { evmWalletAddress, evmWalletId },
      });
      return res.status(200).json({ message: 'Wallet created successfully' });
    } catch (error) {
      this.logger.error('Failed to create wallet', { error });
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error creating wallet',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
