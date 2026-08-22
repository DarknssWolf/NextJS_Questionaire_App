'use client';

import { useEffect } from 'react';
import { signOutAction } from '@/app/actions/auth.actions';

export default function SignOutPage() {
  useEffect(() => {
    void signOutAction();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Signing out...</h1>
        <p className="mt-2 text-gray-600">Please wait while we sign you out.</p>
      </div>
    </div>
  );
}
