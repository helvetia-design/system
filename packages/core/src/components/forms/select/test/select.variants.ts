export const TAG = 'select'

export const HOST_VARIANTS: { testId: string; selectId: string; options: string[]; multiple?: boolean }[] = [
  { testId: 'basic', selectId: 'basic', options: ['Italy'] },
  { testId: 'searchable', selectId: 'searchable', options: ['Germany'] },
  { testId: 'clearable', selectId: 'clearable', options: ['France'] },
  { testId: 'multiple', selectId: 'multi', options: ['German', 'Italian'], multiple: true },
  { testId: 'grouped', selectId: 'grouped', options: ['Basel'] },
]
