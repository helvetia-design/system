import type { Meta } from '@storybook/html-vite'
import {
  BrandIconContactPurple,
  BrandIconCustomerBenefitsPurple,
  BrandIconMobilePaymentDebitCreditCardPurple,
} from '@helvetia-design/assets'
import { StoryFactory, withRender } from '../../utils'

type Args = { color?: 'purple' | 'green' | 'red' | 'yellow' }

const item = (svg: string) => `
          <ds-item variant="accordion" accordion-marker="plus" label="Lorem ipsum dolor" label-level="h3" label-size="h5">
            <ds-brand-icon slot="icon" size="sm" svg='${svg}'></ds-brand-icon>
            <div slot="accordion-content" class="ds-stack-content py-base has-space-base">
              <p class="ds-text">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
              <p class="ds-text">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</p>
            </div>
          </ds-item>`

const meta: Meta<Args> = {
  title: 'Templates/Sections',
}

export default meta

/**
 * STORIES
 * ------------------------------------------------------
 */

const Story = StoryFactory<Args>(meta)

export const AccordionSection = Story({
  ...withRender(
    () => `<section class="ds-container ds-stack py-2xl align-stretch">
  <div class="ds-grid is-desktop row-gap-3xl">
    <div class="ds-col desktop:is-one-third">
      <h2 class="ds-title has-space-none">Dangers in everyday life</h2>
    </div>
    <div class="ds-col desktop:is-half">
      <div class="ds-stack has-space-lg align-stretch">
        <p class="ds-text">Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
        <ds-list size="lg">${item(BrandIconMobilePaymentDebitCreditCardPurple)}${item(BrandIconCustomerBenefitsPurple)}${item(BrandIconContactPurple)}
        </ds-list>
      </div>
    </div>
  </div>
</section>`,
  ),
})
AccordionSection.storyName = 'Accordion Section'

export const SummarySection = Story({
  args: {
    color: 'purple',
  },
  argTypes: {
    color: {
      control: 'select',
      options: ['purple', 'green', 'red', 'yellow'],
      description: 'Background color of the summary box. Use the color of the stage.',
    },
  },
  ...withRender(
    ({ color }) => `<section class="ds-container ds-stack py-2xl align-stretch" aria-labelledby="summary-title">
  <div class="ds-grid is-desktop row-gap-3xl">
    <div class="ds-col desktop:is-one-third">
      <h2 id="summary-title" class="ds-title has-space-none">Summary</h2>
    </div>
    <div class="ds-col desktop:is-half">
      <div class="ds-card is-flat is-${color} has-space-sm">
        <ul class="unordered-list has-icon-check">
          <li><strong>Content:</strong> Summarize the content of the whole article in at least three bullet points. This helps users assess, if the article contains the information they were looking for.</li>
          <li><strong>Color:</strong> Please exclusivley apply the background color of the Title&amp;Image&amp;Text Component for the summary of blog articles. Choose the same color as utilized in the stage.</li>
          <li><strong>Layout:</strong> Highlight the subject text with the colon bold as shown in this example. Use the checkmark list.</li>
          <li><strong>Postition:</strong> Place the summary at the top of the content container.</li>
        </ul>
      </div>
    </div>
  </div>
</section>`,
  ),
})
SummarySection.storyName = 'Summary Section'

export const TeaserCarouselSection = Story({
  ...withRender(
    () => `<section class="ds-container ds-stack py-2xl align-stretch" aria-labelledby="teaser-carousel-title">
  <div class="ds-grid is-desktop row-gap-xl">
    <div class="ds-col desktop:is-one-third">
      <h2 id="teaser-carousel-title" class="ds-title has-space-none">Teaser Gallery Slider</h2>
    </div>
    <div class="ds-col desktop:is-two-thirds">
      <ds-carousel variant="tile" controls="large-below" label="Teaser Gallery Slider" items-per-view="1 tablet:2 desktop:3">
        <ds-carousel-item name="components" navigation>
          <div class="ds-stack-content gap-sm p-base">
            <div class="ds-stack-content gap-base">
              <picture>
                <source media="(min-width: 1024px)" srcset="/assets/images/placeholder.png" />
                <img src="/assets/images/placeholder-square.png" alt="" />
              </picture>
              <div class="ds-stack-content gap-xs">
                <h3 class="ds-title is-5 has-space-none">Components</h3>
                <p class="ds-text">Text (max. 200 Carachters): Learn more about the available Components.</p>
              </div>
            </div>
            <a href="/de/home/components.html" class="ds-link ds-stack as-row align-center-start gap-xs"><ds-icon name="plus"></ds-icon>Mehr erfahren</a>
          </div>
        </ds-carousel-item>
        <ds-carousel-item name="blog-template" navigation>
          <div class="ds-stack-content gap-sm p-base">
            <div class="ds-stack-content gap-base">
              <picture>
                <source media="(min-width: 1024px)" srcset="/assets/images/placeholder.png" />
                <img src="/assets/images/placeholder-square.png" alt="" />
              </picture>
              <div class="ds-stack-content gap-xs">
                <h3 class="ds-title is-5 has-space-none">Blog Template</h3>
                <p class="ds-text">Text (max. 200 Carachters): Learn more about the Blog Template.</p>
              </div>
            </div>
            <a href="/de/home/templates/blog.html" class="ds-link ds-stack as-row align-center-start gap-xs"><ds-icon name="plus"></ds-icon>Mehr erfahren</a>
          </div>
        </ds-carousel-item>
        <ds-carousel-item name="productpage-consultation-request" navigation>
          <div class="ds-stack-content gap-sm p-base">
            <div class="ds-stack-content gap-base">
              <picture>
                <source media="(min-width: 1024px)" srcset="/assets/images/placeholder.png" />
                <img src="/assets/images/placeholder-square.png" alt="" />
              </picture>
              <div class="ds-stack-content gap-xs">
                <h3 class="ds-title is-5 has-space-none">Productpage Consultation Request</h3>
                <p class="ds-text">Text (max. 200 Carachters): Learn more about the Productpage Consultation Request.</p>
              </div>
            </div>
            <a href="/de/home/templates/consultation-request.html" class="ds-link ds-stack as-row align-center-start gap-xs"><ds-icon name="plus"></ds-icon>Mehr erfahren</a>
          </div>
        </ds-carousel-item>
        <ds-carousel-item name="productpage-online-purchase" navigation>
          <div class="ds-stack-content gap-sm p-base">
            <div class="ds-stack-content gap-base">
              <picture>
                <source media="(min-width: 1024px)" srcset="/assets/images/placeholder.png" />
                <img src="/assets/images/placeholder-square.png" alt="" />
              </picture>
              <div class="ds-stack-content gap-xs">
                <h3 class="ds-title is-5 has-space-none">Productpage Onlilne Purchase</h3>
                <p class="ds-text">Text (max. 200 Carachters): Learn more about the Productpage Online Purchase.</p>
              </div>
            </div>
            <a href="/de/home/templates/online-purchase.html" class="ds-link ds-stack as-row align-center-start gap-xs"><ds-icon name="plus"></ds-icon>Mehr erfahren</a>
          </div>
        </ds-carousel-item>
        <ds-carousel-item name="newsdetail" navigation>
          <div class="ds-stack-content gap-sm p-base">
            <div class="ds-stack-content gap-base">
              <picture>
                <source media="(min-width: 1024px)" srcset="/assets/images/placeholder.png" />
                <img src="/assets/images/placeholder-square.png" alt="" />
              </picture>
              <div class="ds-stack-content gap-xs">
                <h3 class="ds-title is-5 has-space-none">Newsdetail</h3>
                <p class="ds-text">Text (max. 200 Carachters): Learn more about the Newsdetail.</p>
              </div>
            </div>
            <a href="/de/home/templates/newsdetail.html" class="ds-link ds-stack as-row align-center-start gap-xs"><ds-icon name="plus"></ds-icon>Mehr erfahren</a>
          </div>
        </ds-carousel-item>
      </ds-carousel>
    </div>
  </div>
</section>`,
  ),
})
TeaserCarouselSection.storyName = 'Teaser Carousel Section'
