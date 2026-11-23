import type { RenderToString } from './mount-ssr'

/** Renders `html` with `renderToString` and fails on render errors or when no component rendered server-side. */
export const renderSsr = async (renderToString: RenderToString, html: string, url: string, caller: string) => {
  const rendered = await renderToString(html, {
    fullDocument: true,
    url,
    serializeShadowRoot: 'declarative-shadow-dom',
  })
  if (!('diagnostics' in rendered)) {
    throw new Error(`${caller}: renderToString unexpectedly returned a stream`)
  }
  const errors = rendered.diagnostics.filter(d => d.level === 'error')
  if (errors.length) {
    throw new Error(`${caller}: SSR render failed:\n${errors.map(e => e.messageText).join('\n\n')}`)
  }
  // `shadowrootmode` alone isn't a reliable "SSR actually happened" signal — some components
  // (e.g. ds-content, ds-stack, ds-root) render light DOM only. `hydratedCount` reflects every
  // component Stencil actually rendered server-side, regardless of shadow DOM usage.
  if (!rendered.hydratedCount) {
    throw new Error(`${caller}: hydratedCount is 0 — no component rendered server-side`)
  }
  if (rendered.html === null) {
    throw new Error(`${caller}: renderToString returned no html`)
  }
  return rendered.html
}
