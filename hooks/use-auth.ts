"use client";

import { authClient } from "@/lib/auth/auth-client";

type User = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();
  
  const signOut = async () => {
    await authClient.signOut();
  };

  return { 
    user: session?.user as User | null, 
    loading: isPending, 
    signOut 
  };
}
