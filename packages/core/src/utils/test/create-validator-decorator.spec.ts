import { getValidationContext } from '../property-decorators/create-validator-decorator'

const stencil = vi.hoisted(() => ({ Build: { isServer: false } }))
const host = { localName: 'ds-test' }

vi.mock('@stencil/core', () => ({
  Build: stencil.Build,
  getElement: () => host,
}))

describe('create-validator-decorator', () => {
  describe('getValidationContext', () => {
    const component = { size: 'huge' }
    const message = '[ds-test] Property "size" must be one of: sm, md. Received: "huge".'

    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    afterEach(() => {
      stencil.Build.isServer = false
      vi.restoreAllMocks()
    })

    test('should log an error with the message and host in the browser', () => {
      getValidationContext(component, 'size').showError('must be one of: sm, md')

      expect(console.error).toHaveBeenCalledWith(message, host)
      expect(console.warn).not.toHaveBeenCalled()
    })

    test('should log a single-string warning on the server', () => {
      stencil.Build.isServer = true
      getValidationContext(component, 'size').showError('must be one of: sm, md')

      expect(console.warn).toHaveBeenCalledTimes(1)
      expect(console.warn).toHaveBeenCalledWith(message)
      expect(console.error).not.toHaveBeenCalled()
    })
  })
})
