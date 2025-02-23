import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  VerifySignatureDto,
  GetLoginPayloadDto,
} from './dto/verify-signature.dto';
import { UsersService } from '../users/users.service';

import { SkipTokenCheck } from './decorators/skip-token-check.decorator';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@SkipTokenCheck()
@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}
  @Post('login')
  async verifySignature(
    @Res() res: Response,
    @Body() { payload, signature }: VerifySignatureDto,
  ) {
    try {
      const user = await this.usersService.findUserByAddress(payload.address);
      if (!user) {
        await this.usersService.createUser({
          address: payload.address.toLowerCase(),
        });
      }

      const verifiedPayload = await this.authService.verifyPayload({
        payload,
        signature,
      });

      if (verifiedPayload.valid) {
        const accessToken = await this.authService.generateJWT(verifiedPayload);

        return res.status(HttpStatus.OK).send({
          user: {
            ...user,
          },
          accessToken,
        });
      }
    } catch (error) {
      console.log('Error in sign-in', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new HttpException(
        'Error processing sign-in request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('get-login-payload')
  async getLoginPayload(@Body() payload: GetLoginPayloadDto) {
    try {
      return await this.authService.generatePayload({
        address: payload.address,
        chainId: payload.chainId,
      });
    } catch (error) {
      console.log('Error in login', error);
      throw new HttpException(
        'Error generating login payload',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    try {
      res.clearCookie('jwt');
      return res.status(HttpStatus.OK).send({ message: 'Logged out' });
    } catch (error) {
      console.log('Error in logout', error);
      throw new HttpException(
        'Error logging out',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
