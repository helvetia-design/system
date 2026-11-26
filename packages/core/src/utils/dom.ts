/**
 * `el.children` filtered by `predicate` — the `:scope > selector` pattern without `:scope`, which
 * Stencil's mock-doc query engine (used during SSR) doesn't support.
 */
export const directChildren = <T extends Element = Element>(el: Element, predicate: (child: Element) => boolean): T[] =>
  Array.from(el.children).filter(predicate) as T[]

export const byTagName =
  (tagName: string) =>
  (child: Element): boolean =>
    child.tagName === tagName

export const getHeadingText = (el: Element): string =>
  el.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() ?? ''

/**
 * Accessible name of a dialog: `label`, else the first slotted heading. Warns when both are missing.
 */
export const resolveDialogName = (el: Element, label: string | undefined, tag: string): string => {
  const name = label || getHeadingText(el)
  if (!name) {
    console.warn(`[${tag}] The dialog has no accessible name. Set \`label\` or slot a heading.`)
  }
  return name
}

/**
 * Whether the default slot receives content other than whitespace text.
 */
export const hasDefaultSlotContent = (el: Element): boolean =>
  Array.from(el.childNodes).some(node =>
    node.nodeType === Node.TEXT_NODE
      ? (node.textContent?.trim().length ?? 0) > 0
      : node.nodeType === Node.ELEMENT_NODE && !(node as Element).hasAttribute('slot'),
  )
