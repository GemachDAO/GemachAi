import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { BalancesService } from './balances.service';
import { BigIntInterceptor } from '../interceptors/bigInt-interceptor';
import { SUPPORTED_CHAINS } from '../constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserInSession } from '../global.entity';

@UseGuards(JwtAuthGuard)
@Controller('balances')
@UseInterceptors(BigIntInterceptor)
export class BalancesController {
  constructor(private balancesService: BalancesService) { }

  @Get('balances/:address')
  async getBalances(
    @Param('address') address: string,
    @CurrentUser() user: UserInSession,
  ) {
    try {
      const balancePromises = SUPPORTED_CHAINS.map(async (chain) => {
        try {
          return await this.balancesService.getBalances({ address, chainId: chain.id });
        } catch (error) {
          Logger.error(`Failed to fetch balances for chain ${chain.id}: ${error.message}`);
          return null; // Return null for failed chains instead of breaking the entire request
        }
      });

      const results = await Promise.all(balancePromises);
      return results.filter(result => result !== null); // Filter out failed results
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
