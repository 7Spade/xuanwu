/**
 * i18n type contracts.
 *
 * Locale: supported locale codes.
 * I18nConfig: runtime configuration shape.
 * TranslationMessages: recursive shape of locale JSON files (e.g. public/localized-files/en.json).
 */

export type Locale = 'en' | 'zh-TW';

export interface I18nConfig {
  defaultLocale: Locale;
  locales: Locale[];
}

export type TranslationMessages = {
  [key: string]: string | TranslationMessages;
};
