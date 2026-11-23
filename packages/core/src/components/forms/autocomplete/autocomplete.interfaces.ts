/**
 * A single suggestion shown in the autocomplete panel.
 *
 * The MVP has no separate submit value: the label is both what the user sees and what the
 * component submits. Showing a label while submitting a code is a deliberate omission —
 * see `docs/apl-gap-analysis.md`, gap 13.
 */
export interface AutocompleteOption {
  label: string
  disabled?: boolean
}

export type AutocompleteChangeDetail = string | null

export type AutocompleteInputDetail = string | null
