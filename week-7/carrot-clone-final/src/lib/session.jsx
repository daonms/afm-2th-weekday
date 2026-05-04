import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import { ensureMyProfile, getMyProfile } from "./api";
import { getSavedNeighborhood } from "./neighborhoodStorage";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function syncSession(nextUser) {
    if (!nextUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser(nextUser);
    try {
      const ensured = await ensureMyProfile(nextUser);
      setProfile(ensured);
    } catch {
      const fallback = await getMyProfile().catch(() => null);
      if (fallback) {
        setProfile(fallback);
      } else {
        setProfile({
          id: nextUser.id,
          email: nextUser.email || "",
          nickname: String(nextUser.user_metadata?.nickname || "").trim() || (nextUser.email ? nextUser.email.split("@")[0] : "회원"),
          neighborhood: getSavedNeighborhood() || "",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) throw error;
        return syncSession(data.user ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setProfile(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      syncSession(session?.user ?? null).catch(() => {
        setUser(null);
        setProfile(null);
        setLoading(false);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    try {
      const next = await getMyProfile();
      setProfile(next);
      return next;
    } catch {
      const fallbackNeighborhood = getSavedNeighborhood() || profile?.neighborhood || "";
      const fallback = user
        ? {
            id: user.id,
            email: user.email || "",
            nickname: String(user.user_metadata?.nickname || "").trim() || (user.email ? user.email.split("@")[0] : "회원"),
            neighborhood: fallbackNeighborhood,
          }
        : null;
      if (fallback) setProfile(fallback);
      return fallback;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
      signOut,
    }),
    [user, profile, loading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
