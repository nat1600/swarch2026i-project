"use client";

import { useMemo } from "react";
import { translations, TranslationDict, Language } from "../../app/games/translations";

export function useTranslation() {
    // For now, we default to Spanish as per user request
    // In a real scenario, this could come from a context or a cookie
    const lang: Language = "es";

    const t = useMemo(() => {
        return translations[lang] || translations.en;
    }, [lang]);

    return { t, lang };
}
