import { createI18n } from 'vue-i18n'
import { messages, getBrowserLocale } from './i18n/locales'
import { urlParams } from './scripts/constants'

const supportedLocales = Object.keys(messages)
const urlLocale = urlParams.get('t')

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: urlLocale || getBrowserLocale(supportedLocales),
  fallbackLocale: 'en',
  messages
})

export const locale = i18n.global.locale
