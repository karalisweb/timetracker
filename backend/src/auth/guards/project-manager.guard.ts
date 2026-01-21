import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * ProjectManagerGuard
 *
 * Permette creazione/modifica progetti solo a:
 * - admin
 * - pm
 *
 * Senior possono vedere ma non modificare.
 */
@Injectable()
export class ProjectManagerGuard implements CanActivate {
  private readonly allowedRoles = ['admin', 'pm'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('Accesso non autorizzato');
    }

    const hasAccess = user.roles.some((role: string) =>
      this.allowedRoles.includes(role),
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Accesso riservato a PM o Admin',
      );
    }

    return true;
  }
}
