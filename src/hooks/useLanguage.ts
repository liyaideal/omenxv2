import { useCallback, useEffect, useRef, useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { setI18nLanguage } from "@/i18n";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SITE_LANGUAGES,
  getLanguage,
  isLanguageCode,
  type LanguageCode,
} from "@/lib/languages";

const readLocal = (): LanguageCode => {
  try {
    const v = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguageCode(v) ? v : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

const writeLocal = (code: LanguageCode) => {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    /* private mode — ignore */
  }
};

/**
 * One language preference for the whole site (CPO 2026-09-22 rule 15):
 * the header switcher and Settings › Preferences read and write the same
 * value. Signed in → `profiles.language` is the truth (mirrored to
 * localStorage so the header does not flash on reload); signed out →
 * localStorage only.
 *
 * Carry-over (CPO 2026-09-28, language-entry-v1 R5): when a user signs in /
 * signs up and their profile has never had a language set (`null`), the
 * language they picked as a guest is written to the profile once, instead
 * of being dropped in favour of the default.
 */
export const useLanguage = () => {
  const { user, profile, updateLanguage } = useUserProfile();
  const [local, setLocal] = useState<LanguageCode>(readLocal);

  const fromProfile = user && isLanguageCode(profile?.language) ? (profile!.language as LanguageCode) : null;
  const code: LanguageCode = fromProfile ?? local;

  // Push the resolved language into the i18n store (drives useT() site-wide).
  useEffect(() => {
    setI18nLanguage(code);
  }, [code]);

  // R5 carry-over: profile loaded, language never set → adopt the guest pick.
  const carriedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !profile || profile.language != null) return;
    if (carriedFor.current === user.id) return;
    carriedFor.current = user.id;
    void updateLanguage(local);
  }, [user, profile, local, updateLanguage]);

  // Keep the local mirror in step with the profile value.
  useEffect(() => {
    if (fromProfile && fromProfile !== local) {
      writeLocal(fromProfile);
      setLocal(fromProfile);
    }
  }, [fromProfile, local]);

  const setLanguage = useCallback(
    async (next: LanguageCode): Promise<{ success: boolean; error?: string }> => {
      writeLocal(next);
      setLocal(next);
      if (!user) return { success: true };
      return updateLanguage(next);
    },
    [user, updateLanguage],
  );

  return { code, language: getLanguage(code), languages: SITE_LANGUAGES, setLanguage };
};
