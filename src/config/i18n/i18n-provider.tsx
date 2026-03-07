/**
 * Module: i18n-provider.tsx
 * Purpose: compatibility re-export for legacy i18n provider import path
 * Responsibilities: redirect i18n provider/hook imports to shared app-providers
 * Constraints: deterministic logic, respect module boundaries
 */

export { I18nProvider, useI18n } from '@/shared/app-providers/i18n-provider'
