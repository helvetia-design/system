const ownValues = new WeakMap<HTMLElement, Map<string, boolean>>()

/**
 * Applies a group's boolean state (e.g. `disabled`) to a child and gives the child its own value back once the group stops forcing it.
 */
export const passDownBooleanProp = <K extends string>(
  child: HTMLElement & Record<K, boolean>,
  key: K,
  groupValue: boolean,
): void => {
  let forced = ownValues.get(child)
  if (groupValue) {
    if (!forced) {
      forced = new Map()
      ownValues.set(child, forced)
    }
    if (!forced.has(key)) {
      // A child that is not upgraded yet has no property, only its attribute.
      const current: unknown = child[key]
      forced.set(key, typeof current === 'boolean' ? current : child.hasAttribute(key))
    }
    child[key] = true as (typeof child)[K]
  } else if (forced?.has(key)) {
    child[key] = forced.get(key) as (typeof child)[K]
    forced.delete(key)
  }
}
