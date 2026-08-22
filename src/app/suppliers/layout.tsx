import Navbar from '@/components/navbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import React from 'react';

export default async function SupplierLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <SidebarProvider className="flex flex-col">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Toaster position="top-center" richColors />
      </SidebarProvider>
    </div>
  );
}
