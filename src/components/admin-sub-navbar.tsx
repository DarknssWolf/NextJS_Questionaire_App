import { Suspense } from 'react';

import { RoleGuard } from './guards/role-guard';
import { NavbarItem } from './navbar-item';

const Navbar = () => {
  return (
    <div className="flex h-16 w-full items-center justify-center gap-2 px-4">
      <div className="flex w-full items-center justify-center gap-4 md:gap-10">
        <nav className="hidden w-full justify-center md:flex md:items-center md:gap-5">
          <RoleGuard roles={['super_admin']}>
            <Suspense
              fallback={
                <div className="text-muted-foreground text-sm font-medium">
                  Questionnaires
                </div>
              }
            >
              <NavbarItem href="/admin/questionnaires">
                Questionnaires
              </NavbarItem>
            </Suspense>
          </RoleGuard>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
