/**
 * Standalone shim for the hosting platform's auth module. Only the standalone Vite build aliases
 * `@/lib/auth/provider` here; the original platform keeps its real module. Everyone is a guest.
 */
import { createContext, useContext, type ReactNode } from "react";

export type GuestUser = { id: "guest"; name: string; isGuest: true };

const GUEST: GuestUser = { id: "guest", name: "訪客", isGuest: true };
const AuthContext = createContext<{ user: GuestUser; signedIn: false }>({ user: GUEST, signedIn: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={{ user: GUEST, signedIn: false }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
