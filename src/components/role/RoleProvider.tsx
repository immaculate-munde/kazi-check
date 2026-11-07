"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ONBOARDED_KEY,
  INTENT_KEY,
  ROLE_KEY,
  readIntent,
  readOnboarded,
  readRole,
  writeOnboarding,
  writeRole,
  type UserRole,
} from "@/lib/role";

type RoleContextValue = {
  ready: boolean;
  role: UserRole | null;
  onboarded: boolean;
  intent: string | null;
  setRole: (role: UserRole) => void;
  completeOnboarding: (role: UserRole, intent: string) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [intent, setIntent] = useState<string | null>(null);

  useEffect(() => {
    setRoleState(readRole());
    setOnboarded(readOnboarded());
    setIntent(readIntent());
    setReady(true);
  }, []);

  const setRole = useCallback((next: UserRole) => {
    setRoleState(next);
    try {
      writeRole(next);
    } catch {
      /* ignore */
    }
  }, []);

  const completeOnboarding = useCallback((next: UserRole, nextIntent: string) => {
    setRoleState(next);
    setOnboarded(true);
    setIntent(nextIntent);
    try {
      writeOnboarding(next, nextIntent);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ ready, role, onboarded, intent, setRole, completeOnboarding }),
    [ready, role, onboarded, intent, setRole, completeOnboarding],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export { ROLE_KEY, ONBOARDED_KEY, INTENT_KEY };
