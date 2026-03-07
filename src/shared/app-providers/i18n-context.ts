/**
 * Module: i18n-context.ts
 * Purpose: define i18n provider context contract and shared i18n types
 * Responsibilities: own i18n context shape and exported i18n type contracts
 * Constraints: deterministic logic, respect module boundaries
 */

import { createContext } from 'react'

import { type Locale, type TranslationMessages } from '@/config/i18n/i18n-types'

export interface I18nContextValue {
  locale: Locale
  messages: TranslationMessages | null
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isLoading: boolean
}

export const I18nContext = createContext<I18nContextValue | undefined>(undefined)
