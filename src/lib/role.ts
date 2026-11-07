export type UserRole = "seeker" | "recruiter";

export const ROLE_KEY = "kc-role";
export const ONBOARDED_KEY = "kc-onboarded";
export const INTENT_KEY = "kc-intent";

export function readRole(): UserRole | null {
  try {
    const value = localStorage.getItem(ROLE_KEY);
    return value === "seeker" || value === "recruiter" ? value : null;
  } catch {
    return null;
  }
}

export function readOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return false;
  }
}

export function readIntent(): string | null {
  try {
    return localStorage.getItem(INTENT_KEY);
  } catch {
    return null;
  }
}

export function writeRole(role: UserRole) {
  localStorage.setItem(ROLE_KEY, role);
}

export function writeOnboarding(role: UserRole, intent: string) {
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(ONBOARDED_KEY, "1");
  localStorage.setItem(INTENT_KEY, intent);
}
