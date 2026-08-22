'use client';

import { type Roles } from '@/types/globals';
import { useSession } from '@/providers/session-provider';

type RoleGuardProps = {
  children: React.ReactNode;
  roles: Roles[];
};

export const useSatisfiesRole = (roles: Roles[]) => {
  const session = useSession();
  return (
    session?.role === 'developer' || roles.some((r) => session?.role === r)
  );
};

export const RoleGuard = ({ children, roles }: RoleGuardProps) => {
  const satisfiesRole = useSatisfiesRole(roles);

  if (!satisfiesRole) return null;

  return <>{children}</>;
};
