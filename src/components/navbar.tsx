import { getCompanyById } from '@/server/services/company.service';
import { getCompanyIdCookie } from '@/lib/cookies';
import { NavbarContent } from '@/components/navbar-content';
import { checkRole } from '@/lib/auth/session';

const Navbar = async () => {
  const companyId = await getCompanyIdCookie();
  const company = companyId ? await getCompanyById(companyId) : null;
  const canAccessDashboard = await checkRole([
    'client_admin',
    'client_additional_admin',
  ]);
  const canAccessSuppliers = await checkRole([
    'client_admin',
    'client_additional_admin',
  ]);
  const canAccessAdmin = await checkRole(['super_admin']);

  return (
    <header className="bg-surface-header sticky top-0 z-50 flex w-full items-center border-b px-4 md:px-6">
      <div className="flex h-16 w-full items-center gap-2 px-4">
        <NavbarContent
          companyName={company?.name}
          canAccessDashboard={canAccessDashboard}
          canAccessSuppliers={canAccessSuppliers}
          canAccessAdmin={canAccessAdmin}
        />
      </div>
    </header>
  );
};

export default Navbar;
