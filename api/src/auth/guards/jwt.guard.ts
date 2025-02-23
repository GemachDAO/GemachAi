import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { thirdwebAuth } from '../thirdweb-client';
import { CustomLogger, Logger } from 'src/libs/logging';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Logger('JwtAuthGuard') private logger: CustomLogger,) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      this.logger.log(`Requested path: ${request.path}`);

      let token: string | undefined;

      // Check Authorization header first
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split('Bearer ')[1];
        this.logger.log('Using Bearer token from Authorization header');
      } else {
        // Fallback to cookies
        token = request.cookies?.Authentication;
        this.logger.log('Using token from cookies');
      }

      if (!token) {
        this.logger.log('No authentication token provided');
        return false;
      }

      const payload = await thirdwebAuth.verifyJWT({ jwt: token });
      request.user = payload;

      return payload.valid;
    } catch (error) {
      this.logger.error('JWT verification failed:', error);
      return false;
    }
  }
}

