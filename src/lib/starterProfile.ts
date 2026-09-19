import sillyname from "sillyname";
import { supabase } from "@/integrations/supabase/client";

/**
 * First-login profile bootstrap shared by every sign-in method.
 *
 * There is no `auth.users` trigger on this database (verified 2026-09-19), so
 * the client creates the `profiles` row itself right after the auth session
 * exists. This used to live inline in AuthContent.handleDemoLogin; the email
 * sign-up path needs the exact same row, so it moved here unchanged.
 *
 * Balance columns are deliberately NOT written — they keep their DB defaults.
 */

export type StarterAuthMethod = "wallet" | "google" | "telegram" | "email";

const AVATAR_SEEDS = ["felix", "aneka", "sophia", "liam", "mia", "oliver", "emma", "noah", "ava", "elijah"];
const AVATAR_BGS = ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf"];

/** Funny display name (e.g. "Fluffy Unicorn" → "Fluffy_Unicorn") satisfying the DB username regex. */
export const generateStarterUsername = (): string => (sillyname() as string).replace(/ /g, "_");

export const generateStarterAvatarUrl = (): string => {
  const seed = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
  const bg = AVATAR_BGS[Math.floor(Math.random() * AVATAR_BGS.length)];
  return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seed}&backgroundColor=${bg}`;
};

/**
 * Upsert the starter profile row. Creates if missing, updates only the
 * non-balance columns if present. Returns the values written so callers can
 * pre-fill forms without waiting for a refetch.
 */
export const upsertStarterProfile = async (
  userId: string,
  method: StarterAuthMethod,
  email: string | null,
): Promise<{ username: string; avatarUrl: string; error: string | null }> => {
  const username = generateStarterUsername();
  const avatarUrl = generateStarterAvatarUrl();

  const profileData: {
    user_id: string;
    username: string;
    avatar_url: string;
    auth_method: string;
    email?: string;
  } = {
    user_id: userId,
    username,
    avatar_url: avatarUrl,
    auth_method: method,
  };
  if (email) profileData.email = email;

  const { error } = await supabase
    .from("profiles")
    .upsert(profileData, { onConflict: "user_id", ignoreDuplicates: false });

  return { username, avatarUrl, error: error ? error.message : null };
};
