import { type Roles } from '@/types/globals';
import { checkRole } from '@/lib/auth/session';

type RoleGuardProps = {
  children: React.ReactNode;
  roles: Roles[];
};

export const RoleGuard = async ({ children, roles }: RoleGuardProps) => {
  const satisfiesRole = await checkRole(roles);

  if (!satisfiesRole) return null;

  return <>{children}</>;
};
