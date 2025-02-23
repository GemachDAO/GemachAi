import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../db/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import configuration from '../configuration';
const configService = new ConfigService(configuration());
@Global()
@Module({
  imports: [
    // JwtModule.registerAsync(jwtConfig()),
    JwtModule.register({
      secret: configService.get('jwtSecret'),
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    PrismaService,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard, //@UseGuard(JwtAuthGuard)
    // },
  ],
  exports: [AuthService, UsersService],
})
export class AuthModule {}
