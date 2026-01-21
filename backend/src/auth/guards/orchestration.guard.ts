import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * OrchestrationGuard
 *
 * Permette accesso al modulo Orchestration solo a:
 * - admin
 * - pm
 * - senior
 *
 * Gli executor NON hanno accesso.
 */
@Injectable()
export class OrchestrationGuard implements CanActivate {
  private readonly allowedRoles = ['admin', 'pm', 'senior'];

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
        'Accesso riservato a PM, Senior o Admin',
      );
    }

    return true;
  }
}
