import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class UserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userIdFromParams = Number(request.params.id);

    if (!user) {
      throw new ForbiddenException('Missing user from request');
    }

    if (user?.role === 'admin') return true;

    if (user.id !== userIdFromParams) {
      throw new ForbiddenException(
        'You are not allowed to modify another user’s account',
      );
    }

    return true;
  }
}
