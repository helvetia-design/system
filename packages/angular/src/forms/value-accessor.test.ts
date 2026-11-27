import { Injector } from '@angular/core'
import { describe, expect, test, vi } from 'vitest'
import { DsValueAccessor } from './value-accessor'

// The real @angular/forms pulls in partially compiled declarations that need the JIT compiler.
vi.mock('@angular/forms', () => ({ NgControl: class {} }))

type GroupElement = HTMLElement & {
  value: string | null
  disabled: boolean
  invalid: boolean
  invalidText: string
  autoInvalidOff: boolean
}

function setup() {
  const group = document.createElement('div') as unknown as GroupElement
  const nested = document.createElement('div')
  group.appendChild(nested)
  document.body.appendChild(group)

  const injector = { get: () => null } as unknown as Injector
  const accessor = new DsValueAccessor<GroupElement, 'value'>(group, injector, {
    changeEvent: 'dsChange',
    blurEvent: 'dsBlur',
    valueProp: 'value',
  })
  const onChange = vi.fn()
  const onTouched = vi.fn()
  accessor.registerOnChange(onChange)
  accessor.registerOnTouched(onTouched)
  accessor.init()

  return { group, nested, accessor, onChange, onTouched }
}

describe('DsValueAccessor', () => {
  test('forwards the host element its own change and blur events', () => {
    const { group, accessor, onChange, onTouched } = setup()

    group.dispatchEvent(new CustomEvent('dsChange', { detail: 'a', bubbles: true }))
    group.dispatchEvent(new CustomEvent('dsBlur', { bubbles: true }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith('a')
    expect(onTouched).toHaveBeenCalledTimes(1)
    accessor.destroy()
    group.remove()
  })

  test('ignores change and blur events bubbling up from a nested form control', () => {
    const { group, nested, accessor, onChange, onTouched } = setup()

    nested.dispatchEvent(new CustomEvent('dsChange', { detail: 'Peter', bubbles: true }))
    nested.dispatchEvent(new CustomEvent('dsBlur', { bubbles: true }))

    expect(onChange).not.toHaveBeenCalled()
    expect(onTouched).not.toHaveBeenCalled()
    accessor.destroy()
    group.remove()
  })
})
