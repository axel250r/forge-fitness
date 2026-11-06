// Tiny dependency-free i18n. English source strings are the keys; locale files in
// src/locales/ map them to translations and are lazy-loaded (Vite code-splits each
// import.meta.glob entry), so the initial bundle stays English-only.
// Exercise instructions come from separately generated packs in src/instr/ (one per
// language, from the upstream dataset) — also lazy-loaded on language switch.
import { useSyncExternalStore } from 'react'

// UI languages. de/pt have no instruction pack upstream — instructions fall back to English.
export const LANGS = {
  en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
  pt: 'Português', pl: 'Polski', tr: 'Türkçe', ru: 'Русский', zh: '中文',
  ko: '한국어', hi: 'हिन्दी'
}
export const INSTR_LANGS = ['en', 'es', 'fr', 'it', 'tr', 'ru', 'zh', 'hi', 'pl', 'ko']
const DATE_LOCALES = {
  en: 'en-GB', de: 'de-DE', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', pt: 'pt-PT',
  pl: 'pl-PL', tr: 'tr-TR', ru: 'ru-RU', zh: 'zh-CN', ko: 'ko-KR', hi: 'hi-IN'
}

const localePacks = import.meta.glob('../locales/*.js')
const instrPacks = import.meta.glob('../instr/*.js')
// Translations of VigorUp's own exercises (lib/extra-exercises.js) for every language except
// English (the source) and Spanish (kept inline in ex.i18n.es), one lazy file per language.
const extraPacks = import.meta.glob('../extra-i18n/*.js')

let lang = 'en'
let dict = {}
let instr = null            // { exId: [steps] } for the current language, null = English
let extra = null            // { exId: { st, desc } } for VigorUp's own exercises, null = none
let version = 0
const subs = new Set()
const notify = () => { version++; subs.forEach(f => f()) }

export const getLang = () => lang
export const dateLocale = () => DATE_LOCALES[lang] || 'en-GB'

// Translate a source string; {0},{1}… are replaced with args (also on the English fallback).
export function t(s, ...args) {
  let v = dict[s] || s
  for (let i = 0; i < args.length; i++) v = v.replaceAll('{' + i + '}', args[i])
  return v
}
// Instructions for an exercise in the current language (English steps as fallback). An
// exercise VigorUp wrote itself carries Spanish inline in ex.i18n (lib/extra-exercises.js) and
// the other languages in src/extra-i18n/, instead of living in the generated packs.
const ownFor = ex => (extra && extra[ex.id]) || (ex.i18n && ex.i18n[lang]) || null
export const hasOwnTranslation = ex => !!ownFor(ex)
export const instrFor = ex => (instr && instr[ex.id]) || ownFor(ex)?.st || ex.st || []
export const descFor = ex => ownFor(ex)?.desc || ex.desc || ''

export async function setLang(l) {
  if (!LANGS[l]) l = 'en'
  if (l === lang && version > 0) return
  lang = l
  try {
    dict = l === 'en' ? {} : (await localePacks['../locales/' + l + '.js']()).default
    instr = l === 'en' || !INSTR_LANGS.includes(l) ? null : (await instrPacks['../instr/' + l + '.js']()).default
  } catch (e) { dict = {}; instr = null }
  try {
    const pack = extraPacks['../extra-i18n/' + l + '.js']
    extra = pack ? (await pack()).default : null
  } catch (e) { extra = null }
  notify()
}

// Re-renders the subscribing component (and its children) whenever the language changes.
export function useLang() {
  return useSyncExternalStore(fn => { subs.add(fn); return () => subs.delete(fn) }, () => version)
}
