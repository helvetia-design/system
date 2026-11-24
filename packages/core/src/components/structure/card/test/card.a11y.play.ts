import { test } from '@helvetia-design/playwright'

test('basic', async ({ page, a11y }) => {
  await page.mount(`
    <ds-card>
      <ds-card-header>
        <ds-card-title>Heading</ds-card-title>
        <ds-close></ds-close>
      </ds-card-header>
      <ds-card-content>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Recusandae vero architecto rerum sed non eum qui
        odio sint! Sunt ad numquam ducimus aut minus nihil, officiis quidem eum inventore eos?
      </ds-card-content>
      <ds-card-actions>
        <ds-button color="secondary">Button</ds-button>
        <ds-button>Button</ds-button>
      </ds-card-actions>
    </ds-card>`)
  await a11y('ds-card')
})

test('css-basic', async ({ page, a11y }) => {
  await page.mount(`
    <article class="card">
      <header class="card-header">
        <h3 class="title">Header</h3>
        <ds-close></ds-close>
      </header>
      <div class="card-content">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Recusandae vero architecto rerum sed non eum qui
        odio sint! Sunt ad numquam ducimus aut minus nihil, officiis quidem eum inventore eos?
      </div>
      <footer class="card-actions">
        <button class="button is-secondary">Button</button>
        <button class="button">Button</button>
      </footer>
    </article>`)
  await a11y('article')
})

test.describe('colors', () => {
  const COLORS = [
    '',
    'primary',
    'grey',
    'dashed',
    'red',
    'yellow',
    'purple',
    'green',
    'red-dark',
    'yellow-dark',
    'purple-dark',
    'green-dark',
  ] as const
  COLORS.forEach(color => {
    test(color, async ({ page, a11y }) => {
      await page.mount(`<ds-card color="${color}">
        <ds-card-header>
          <ds-card-title>${color}</ds-card-title>
        </ds-card-header>
      </ds-card>`)
      await a11y(`ds-card`)
    })
  })
})
