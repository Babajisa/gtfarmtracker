import { createClient } from "./supabase/client";

export type Profile = {
  id: string;
  is_premium: boolean;
  premium_since: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetch profile:", error);
    return null;
  }

  if (!data) {
    console.warn("Profile tidak ditemukan untuk user:", user.id);
    return null;
  }

  return data as Profile;
}

export async function isPremium(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.is_premium === true;
}