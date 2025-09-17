import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useEffect, useState, useRef } from "react";

import { useModelSettingsStore } from "../stores";
import type { ModelSettings } from "../types";
import { getDefaultModelSettings } from "../utils/constants";
import type { Language } from "../utils/languages";
import { findLanguage } from "../utils/languages";


export type SettingsModel = {
  settings: ModelSettings;
  updateSettings: <Key extends keyof ModelSettings>(key: Key, value: ModelSettings[Key]) => void;
  updateLangauge: (language: Language) => void;
};

export function useSettings(): SettingsModel {
  const [_modelSettings, set_ModelSettings] = useState<ModelSettings>(getDefaultModelSettings());
  const modelSettings = useModelSettingsStore.use.modelSettings();
  const updateSettings = useModelSettingsStore.use.updateSettings();
  const router = useRouter();
  const { i18n } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const languageChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // The server doesn't have access to local storage so rendering Zustand directly  will lead to a hydration error
  useEffect(() => {
    setIsMounted(true);
    set_ModelSettings(modelSettings);
  }, [modelSettings]);

  // We must handle language setting changes uniquely as the router must be the source of truth for the language
  useEffect(() => {
    if (isMounted && router.isReady && router.locale !== modelSettings.language.code) {
      updateSettings("language", findLanguage(router.locale || "en"));
    }
  }, [isMounted, router.isReady, router.locale, modelSettings.language.code, updateSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (languageChangeTimeoutRef.current) {
        clearTimeout(languageChangeTimeoutRef.current);
      }
    };
  }, []);

  const updateLangauge = (language: Language): void => {
    // Only proceed if the language is actually different
    if (router.locale === language.code) {
      return;
    }
    
    // Prevent multiple simultaneous language changes
    if (router.isReady === false) {
      return;
    }
    
    // Prevent language changes if we're already syncing from router
    if (modelSettings.language.code !== router.locale) {
      return;
    }
    
    // Clear any pending language change
    if (languageChangeTimeoutRef.current) {
      clearTimeout(languageChangeTimeoutRef.current);
    }
    
    // Debounce language changes to prevent rapid successive calls
    languageChangeTimeoutRef.current = setTimeout(() => {
      const performLanguageChange = async () => {
        try {
          // Update the i18n language first
          await i18n.changeLanguage(language.code);
          
          if (isMounted && router.isReady) {
            // Double-check that we're not already on the target locale
            if (router.locale === language.code) {
              return;
            }
            
            // Check if we're already on the target URL to prevent hard navigation
            const currentUrl = router.asPath;
            const expectedUrl = `/${language.code}${currentUrl === '/' ? '' : currentUrl}`;
            
            if (currentUrl === expectedUrl) {
              return;
            }
            
            // Use Next.js built-in locale switching with the current path
            const { pathname, asPath, query } = router;
            
            // Use replace to avoid adding to history stack
            await router.replace({ pathname, query }, asPath, {
              locale: language.code,
              shallow: true, // Use shallow routing to prevent full page reload
            });
          }
        } catch (error) {
          console.error('Error changing language:', error);
          // Revert i18n language change on error
          await i18n.changeLanguage(router.locale || 'en');
        }
      };
      
      // Execute the async function without awaiting it
      void performLanguageChange();
    }, 100); // 100ms debounce
  };

  return {
    settings: _modelSettings,
    updateSettings: updateSettings,
    updateLangauge: updateLangauge,
  };
}
