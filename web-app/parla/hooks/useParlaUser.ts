"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { checkUserExistsAction } from "@/actions/auth/authActions";
import type { Language } from "@/lib/types/dictionary";

const LANG_NAME_TO_CODE: Record<string, Language> = {
  Spanish: "es",
  English: "en",
  French: "fr",
  German: "de",
  Italian: "it",
  Portuguese: "pt",
  Dutch: "nl",
  Polish: "pl",
  Russian: "ru",
  Japanese: "ja",
  Chinese: "zh",
  Korean: "ko",
  Arabic: "ar",
};

interface ParlaUser {
  numericId: number | null;
  nativeLanguageId: number | null;
  learningLanguageId: number | null;
  learningLanguageCode: Language | null;
  isLoading: boolean;
}

export function useParlaUser(): ParlaUser {
  const { user, isLoading: isAuth0Loading } = useUser();
  const [numericId, setNumericId] = useState<number | null>(null);
  const [nativeLanguageId, setNativeLanguageId] = useState<number | null>(null);
  const [learningLanguageId, setLearningLanguageId] = useState<number | null>(null);
  const [learningLanguageCode, setLearningLanguageCode] = useState<Language | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuth0Loading || !user) return;

    checkUserExistsAction().then(({ exists, user: parlaUser }) => {
      if (exists && parlaUser) {
        setNumericId(parseInt(parlaUser.id));
        setNativeLanguageId(parlaUser.native_language.id);
        setLearningLanguageId(parlaUser.learning_language.id);
        setLearningLanguageCode(
          LANG_NAME_TO_CODE[parlaUser.learning_language.name] ?? "en"
        );
      }
      setIsLoading(false);
    });
  }, [user, isAuth0Loading]);

  return { numericId, nativeLanguageId, learningLanguageId, learningLanguageCode, isLoading };
}
