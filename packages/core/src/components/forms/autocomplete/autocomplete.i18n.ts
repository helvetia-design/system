import { I18n } from '../../../interfaces'

interface I18nDsAutocomplete {
  suggestions: string
  noResults: string
}

export const i18nDsAutocomplete: I18n<I18nDsAutocomplete> = {
  de: {
    suggestions: 'Vorschläge',
    noResults: 'Keine Ergebnisse',
  },
  en: {
    suggestions: 'Suggestions',
    noResults: 'No results',
  },
  fr: {
    suggestions: 'Suggestions',
    noResults: 'Aucun résultat',
  },
  it: {
    suggestions: 'Suggerimenti',
    noResults: 'Nessun risultato',
  },
  nl: {
    suggestions: 'Suggesties',
    noResults: 'Geen resultaten',
  },
  es: {
    suggestions: 'Sugerencias',
    noResults: 'Sin resultados',
  },
  pl: {
    suggestions: 'Sugestie',
    noResults: 'Brak wyników',
  },
  pt: {
    suggestions: 'Sugestões',
    noResults: 'Sem resultados',
  },
  sv: {
    suggestions: 'Förslag',
    noResults: 'Inga resultat',
  },
  fi: {
    suggestions: 'Ehdotukset',
    noResults: 'Ei tuloksia',
  },
}
