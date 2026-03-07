"use client";

/**
 * Module: i18n-provider.tsx
 * Purpose: host i18n provider lifecycle and translation hook
 * Responsibilities: manage locale/messages state and expose useI18n
 * Constraints: deterministic logic, respect module boundaries
 */

import { useContext, useEffect, useState, type ReactNode } from 'react'

import { getPreferredLocale, i18nConfig, loadMessages, setLocalePreference } from '@/config/i18n/i18n'
import { type Locale, type TranslationMessages } from '@/config/i18n/i18n-types'

import { I18nContext } from './i18n-context'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(i18nConfig.defaultLocale)
  const [messages, setMessages] = useState<TranslationMessages | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initLocale = getPreferredLocale()
    setLocaleState(initLocale)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      try {
        const nextMessages = await loadMessages(locale)
        if (isMounted) {
          setMessages(nextMessages)
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    setLocalePreference(newLocale)
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    if (!messages) return key

    const keys = key.split('.')
    let value: unknown = messages

    for (const itemKey of keys) {
      if (value && typeof value === 'object' && itemKey in value) {
        value = (value as Record<string, unknown>)[itemKey]
      } else {
        return key
      }
    }

    if (typeof value !== 'string') return key
    if (!params) return value
    return value.replace(/\{(\w+)\}/g, (_, paramKey) => String(params[paramKey] ?? `{${paramKey}}`))
  }

  return (
    <I18nContext.Provider value={{ locale, messages, setLocale, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
