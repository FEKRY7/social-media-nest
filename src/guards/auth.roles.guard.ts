import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { CURRENT_USER_KEY } from 'src/untils/constants';
import { UserType } from 'src/untils/enums';
import { JWTPayloadType } from 'src/untils/types';
import { UsersService } from 'src/Users/users.service';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles: UserType[] = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      return false;
    }
    const request: Request = context.switchToHttp().getRequest();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (token && type === 'Bearer') {
      try {
        const payload: JWTPayloadType = await this.jwtService.verifyAsync(
          token,
          {
            secret: process.env.JWT_SECRET,
          },
        );
        const user = await this.usersService.getCurrentUser(payload._id);
        if (!user) return false;

        if (roles.includes(user.role as UserType)) {
          request[CURRENT_USER_KEY] = payload;
          return true;
        }
      } catch (error) {
        // Validate token existence in the DB
        await this.usersService.getToken(token);
      }
    } else {
      throw new UnauthorizedException('No token provided or invalid format');
    }

    throw new UnauthorizedException('not authorized user');
  }
}



// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { JwtService } from '@nestjs/jwt';
// import { Request } from 'express';
// import { CURRENT_USER_KEY } from 'src/untils/constants';
// import { UserType } from 'src/untils/enums';
// import { JWTPayloadType } from 'src/untils/types';
// import { UsersService } from 'src/Users/users.service';

// @Injectable()
// export class AuthRolesGuard implements CanActivate {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly reflector: Reflector,
//     private readonly usersService: UsersService,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const roles: UserType[] = this.reflector.getAllAndOverride('roles', [
//       context.getHandler(),
//       context.getClass(),
//     ]);
  
//     if (!roles || roles.length === 0) {
//       throw new UnauthorizedException('Access denied: No roles assigned');
//     }
  
//     const request: Request = context.switchToHttp().getRequest();
//     const authHeader = request.headers.authorization;
  
//     if (!authHeader) {
//       throw new UnauthorizedException('No authorization header provided');
//     }
  
//     const [type, token] = authHeader.split(' ');
//     if (!token || type !== 'Bearer') {
//       throw new UnauthorizedException('Invalid token format');
//     }
  
//     try {
//       // ✅ التحقق من التوكن باستخدام `jwtService`
//       const payload: JWTPayloadType = await this.jwtService.verifyAsync(token, {
//         secret: process.env.JWT_SECRET,
//       });
  
//       // ✅ البحث عن المستخدم بناءً على الـ ID
//       const user = await this.usersService.getCurrentUser(payload._id);
//       if (!user) {
//         throw new UnauthorizedException('User not found');
//       }
  
//       // ✅ التحقق من دور المستخدم
//       if (!roles.includes(user.role as UserType)) {
//         throw new UnauthorizedException('You do not have permission to access this resource');
//       }
  
//       // ✅ التحقق من صحة التوكن في قاعدة البيانات
//       const isTokenValid = await this.usersService.getToken(token);
//       if (!isTokenValid) {
//         throw new UnauthorizedException('Expired or invalid token');
//       }
  
//       request[CURRENT_USER_KEY] = payload; // ✅ تخزين المستخدم في الطلب
//       return true;
//     } catch (error) {
//       console.error('Auth Guard Error:', error);
//       throw new UnauthorizedException('Unauthorized user');
//     }
//   }  
// }
