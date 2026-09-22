import { useCallback, useEffect, useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
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
 */
export const useLanguage = () => {
  const { user, profile, updateLanguage } = useUserProfile();
  const [local, setLocal] = useState<LanguageCode>(readLocal);

  const fromProfile = user && isLanguageCode(profile?.language) ? (profile!.language as LanguageCode) : null;
  const code: LanguageCode = fromProfile ?? local;

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
