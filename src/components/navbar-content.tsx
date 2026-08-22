'use client';

import { LayoutDashboard, Settings, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { NavbarItem } from './navbar-item';
import { NotificationComponent } from './notification-component';
import { BRAND } from '@/lib/brand';

interface NavbarContentProps {
  companyName?: string;
  canAccessDashboard: boolean;
  canAccessSuppliers: boolean;
  canAccessAdmin: boolean;
}

export function NavbarContent({
  companyName,
  canAccessDashboard,
  canAccessSuppliers,
  canAccessAdmin,
}: NavbarContentProps) {
  return (
    <>
      <div className="flex items-center gap-4 md:gap-10">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <LayoutDashboard className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="font-bold">{BRAND.name}</span>
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <Users className="h-5 w-5" />
                Suppliers
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <Settings className="h-5 w-5" />
                Admin
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/">
          <Image
            src="/logo.svg"
            alt={`${BRAND.name} logo`}
            width={323}
            height={110}
            className="h-8 w-auto"
          />
        </Link>
        {companyName && <span className="font-semibold">{companyName}</span>}
        <nav className="hidden md:flex md:items-center md:gap-5">
          {canAccessDashboard && (
            <NavbarItem href="/dashboard">Dashboard</NavbarItem>
          )}
          {canAccessSuppliers && (
            <NavbarItem href="/suppliers">Suppliers</NavbarItem>
          )}
          {canAccessAdmin && (
            <NavbarItem href="/admin/questionnaires">Admin</NavbarItem>
          )}
        </nav>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
        <NotificationComponent />
        <SignOutButton>
          <Button variant="secondary">Logout</Button>
        </SignOutButton>
      </div>
    </>
  );
}
