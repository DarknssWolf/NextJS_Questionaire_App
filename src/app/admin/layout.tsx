import AdminSubNavbar from '@/components/admin-sub-navbar';
import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import { Toaster } from '@/components/ui/sonner';
import React from 'react';

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <AdminSubNavbar />
      <div className="container mx-auto flex-1">{children}</div>
      <Footer />
      <Toaster position="top-center" richColors />
    </div>
  );
}
