import { I18n } from '../../../../interfaces'

interface I18nDsSnackbar {
  showNotification: string
}

export const i18nDsSnackbar: I18n<I18nDsSnackbar> = {
  de: {
    showNotification: 'Benachrichtigung anzeigen',
  },
  en: {
    showNotification: 'Show notification',
  },
  fr: {
    showNotification: 'Afficher la notification',
  },
  it: {
    showNotification: 'Mostra notifica',
  },
  nl: {
    showNotification: 'Melding tonen',
  },
  es: {
    showNotification: 'Mostrar notificación',
  },
  pl: {
    showNotification: 'Pokaż powiadomienie',
  },
  pt: {
    showNotification: 'Mostrar notificação',
  },
  sv: {
    showNotification: 'Visa avisering',
  },
  fi: {
    showNotification: 'Näytä ilmoitus',
  },
}
