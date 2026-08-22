'use client';

import { type ReactNode, createContext, useContext } from 'react';
import { type SessionPayload } from '@/types/globals';

const MISSING_PROVIDER = Symbol('missing-session-provider');

const SessionContext = createContext<
  SessionPayload | null | typeof MISSING_PROVIDER
>(MISSING_PROVIDER);

export function SessionProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: SessionPayload | null;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = (): SessionPayload | null => {
  const context = useContext(SessionContext);

  if (context === MISSING_PROVIDER) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
};
