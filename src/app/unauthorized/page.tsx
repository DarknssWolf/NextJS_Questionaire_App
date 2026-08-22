'use client';

import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/auth/sign-out-button';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <SignOutButton>
          <Button>Sign Out</Button>
        </SignOutButton>
      </div>
    </div>
  );
}
