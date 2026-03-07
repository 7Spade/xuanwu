"use client";

/**
 * Module: firebase-provider.tsx
 * Purpose: host firebase resource provider and consumer hook
 * Responsibilities: provide app/auth/db/storage clients via context
 * Constraints: deterministic logic, respect module boundaries
 */

import { useContext, type ReactNode } from 'react';

import { app, auth, db, storage } from '@/shared-infra/frontend-firebase';
import { FirebaseContext } from '../contexts/firebase-context';

export function FirebaseClientProvider({ children }: { children: ReactNode; }) {
  const value = { app, db, auth, storage };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useFirebase must be used within FirebaseClientProvider");
  return context;
};
