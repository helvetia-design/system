import { passDownBooleanProp } from '../pass-down'

type Child = HTMLElement & { disabled: boolean; readonly: boolean }

const createChild = (props: Partial<Pick<Child, 'disabled' | 'readonly'>> = {}): Child => {
  const child = document.createElement('div') as unknown as Child
  child.disabled = props.disabled ?? false
  child.readonly = props.readonly ?? false
  return child
}

describe('passDownBooleanProp', () => {
  test('keeps the child value while the group is not forcing it', () => {
    const child = createChild({ disabled: true })

    passDownBooleanProp(child, 'disabled', false)

    expect(child.disabled).toBe(true)
  })

  test('forces the child to true while the group value is true', () => {
    const child = createChild()

    passDownBooleanProp(child, 'disabled', true)

    expect(child.disabled).toBe(true)
  })

  test('restores the child value when the group switches back to false', () => {
    const enabled = createChild()
    const disabled = createChild({ disabled: true })

    passDownBooleanProp(enabled, 'disabled', true)
    passDownBooleanProp(disabled, 'disabled', true)
    passDownBooleanProp(enabled, 'disabled', false)
    passDownBooleanProp(disabled, 'disabled', false)

    expect(enabled.disabled).toBe(false)
    expect(disabled.disabled).toBe(true)
  })

  test('keeps the first own value when the group forces repeatedly', () => {
    const child = createChild()

    passDownBooleanProp(child, 'disabled', true)
    passDownBooleanProp(child, 'disabled', true)
    passDownBooleanProp(child, 'disabled', false)

    expect(child.disabled).toBe(false)
  })

  test('respects a child value changed while the group is not forcing it', () => {
    const child = createChild()

    passDownBooleanProp(child, 'disabled', true)
    passDownBooleanProp(child, 'disabled', false)
    child.disabled = true
    passDownBooleanProp(child, 'disabled', false)

    expect(child.disabled).toBe(true)
  })

  test('tracks each key separately', () => {
    const child = createChild({ readonly: true })

    passDownBooleanProp(child, 'disabled', true)
    passDownBooleanProp(child, 'readonly', true)
    passDownBooleanProp(child, 'disabled', false)
    passDownBooleanProp(child, 'readonly', false)

    expect(child.disabled).toBe(false)
    expect(child.readonly).toBe(true)
  })

  test('reads the attribute of a child without the property', () => {
    const child = document.createElement('div') as unknown as Child
    child.setAttribute('disabled', '')

    passDownBooleanProp(child, 'disabled', true)
    passDownBooleanProp(child, 'disabled', false)

    expect(child.disabled).toBe(true)
  })
})
