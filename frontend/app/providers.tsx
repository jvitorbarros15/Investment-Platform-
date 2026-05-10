"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { getSupabase } from "@/lib/supabase";

function AuthSessionSync() {
  const setSession = useAuthStore((s) => s.setSession);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session?.access_token ?? null, data.session?.user.email ?? null);
      setInitialized(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.access_token ?? null, session?.user.email ?? null);
      setInitialized(true);
    });

    return () => data.subscription.unsubscribe();
  }, [setInitialized, setSession]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionSync />
      {children}
    </QueryClientProvider>
  );
}
