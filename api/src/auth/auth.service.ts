import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { createThirdwebClient, ThirdwebClient } from 'thirdweb';
import { ConfigService } from '@nestjs/config';
import { getRandomValues } from 'crypto';
import {
  createAuth,
  VerifyLoginPayloadParams,
  VerifyLoginPayloadResult,
} from 'thirdweb/auth';
import { privateKeyAccount } from 'thirdweb/wallets';
@Injectable()
export class AuthService {
  client: ThirdwebClient;
  thirdwebAuth: ReturnType<typeof createAuth>;

  constructor(
    private configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.client = createThirdwebClient({
      secretKey: this.configService.get('thirdwebSecretKey'),
    });

    this.thirdwebAuth = createAuth({
      domain: this.configService.get('nextPublicThirwebAuthDomain'),
      adminAccount: privateKeyAccount({
        client: this.client,
        privateKey: this.configService.get('thirdwebAdminPrivateKey'),
      }),
      client: this.client,
      jwt: {
        expirationTimeSeconds: 60 * 60 * 24 * 30,

        jwtId: {
          generate: async () => {
            const jwt = await this.jwtService.signAsync({});
            return jwt;
          },

          validate: async (jwtId: string) => {
            try {
              await this.jwtService.verifyAsync(jwtId);
              return true;
            } catch (error) {
              return false;
            }
          },
        },
      },
    });
  }

  async verifySignature(payload: VerifyLoginPayloadParams) {
    try {
      const result = await this.thirdwebAuth.verifyPayload(payload);
      if (!result.valid) {
        throw new UnauthorizedException('Invalid signature');
      }
      return result;
    } catch (error) {
      throw new UnauthorizedException('Signature verification failed');
    }
  }

  async generateJWT(payload: VerifyLoginPayloadResult) {
    if (payload.valid) {
      return await this.thirdwebAuth.generateJWT({
        payload: payload.payload,
      });
    }
  }

  async verifyJWT(token: string) {
    try {
      return await this.thirdwebAuth.verifyJWT({ jwt: token });
    } catch (error) {
      throw new UnauthorizedException('Invalid JWT token');
    }
  }

  async verifyPayload(payload: VerifyLoginPayloadParams) {
    return await this.thirdwebAuth.verifyPayload(payload);
  }

  async generatePayload(payload: { address: string; chainId: number }) {
    return await this.thirdwebAuth.generatePayload(payload);
  }
}
