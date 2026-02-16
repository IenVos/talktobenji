"use client";

import { createContext, useContext, useCallback, ReactNode } from "react";
import { useQuery, useMutation, useAction } from "convex/react";

interface AdminAuthContextType {
  adminToken: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  adminToken: null,
});

export function AdminAuthProvider({
  adminToken,
  children,
}: {
  adminToken: string | null;
  children: ReactNode;
}) {
  return (
    <AdminAuthContext.Provider value={{ adminToken }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

/**
 * useQuery wrapper die automatisch adminToken injecteert.
 * Skipt de query als er nog geen adminToken is.
 */
export function useAdminQuery(queryRef: any, args: any) {
  const { adminToken } = useAdminAuth();
  const shouldSkip = !adminToken || args === "skip";
  const enrichedArgs = shouldSkip ? "skip" : { ...args, adminToken };
  return useQuery(queryRef, enrichedArgs);
}

/**
 * useMutation wrapper die automatisch adminToken injecteert.
 */
export function useAdminMutation(mutationRef: any) {
  const { adminToken } = useAdminAuth();
  const rawMutation = useMutation(mutationRef);
  return useCallback(
    (args: any = {}) => {
      if (!adminToken) throw new Error("Niet ingelogd als admin");
      return rawMutation({ ...args, adminToken });
    },
    [rawMutation, adminToken]
  );
}

/**
 * useAction wrapper die automatisch adminToken injecteert.
 */
export function useAdminAction(actionRef: any) {
  const { adminToken } = useAdminAuth();
  const rawAction = useAction(actionRef);
  return useCallback(
    (args: any = {}) => {
      if (!adminToken) throw new Error("Niet ingelogd als admin");
      return rawAction({ ...args, adminToken });
    },
    [rawAction, adminToken]
  );
}
