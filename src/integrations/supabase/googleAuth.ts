import { supabase } from "./client";

function getRedirectUrl(): string {
  if (typeof window === "undefined") {
    return "http://localhost:5173/auth";
  }
  return `${window.location.origin}/auth`;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getRedirectUrl(),
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}
