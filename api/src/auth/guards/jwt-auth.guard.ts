import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CustomLogger, Logger } from '../../libs/logging';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Logger('JwtAuthGuard') private logger: CustomLogger,
    private authService: AuthService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();

      this.logger.log(`Requested path: ${request.path}`);
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        this.logger.log('No token provided');
        throw new UnauthorizedException('Please provide token');
      }
      const token = authHeader.split('Bearer ')[1];
      const payload = await this.authService.verifyJWT(token);

      request.user = payload;
      return payload.valid;
    } catch (error) {
      console.error('JWT verification failed:', error);
      throw new UnauthorizedException('Please provide token');
    }
  }
}
