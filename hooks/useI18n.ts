'use client'

import { useTranslations as useI18nTranslations, type Locale } from '@/lib/i18n'

export function useI18n(locale: Locale = 'es') {
  return useI18nTranslations(locale)
}
