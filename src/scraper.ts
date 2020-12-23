import { scroll } from './utils'
import { decompose } from './url'
import { Browser, launch, Page } from 'puppeteer'

// List of social media platforms
enum Platforms {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  PINTEREST = 'pinterest',
  TIKTOK = 'tiktok',
  TWITTER = 'twitter',
  YOUTUBE = 'youtube'
}

// Data type for handle record
type SocialMediaHandle = { [P in Platforms]?: string }

/**
 * Launches a browser instance and opens a page to the validated url input.
 * Try to scrape `html.lang`, `document.title`, `meta.keywords & .description`,
 * any `anchors` pointing to social media `Platforms`.
 *
 * Never throw an error so as not to invalidate the whole `Promise.all` batch.
 */
export default async (url: string) : Promise<{ [k: string]: string }> => {

  /**
   * Validate and analyse the url.
   */

  const urlData = decompose(url)

  if (!urlData) {
    // Exit if there is invalid url
    return {
      error: url,
      reason: 'Input url invalid'
    }
  }

  /**
   * Launch the browser instance and load page tabs.
   */

  let browser: Browser
  let page: Page

  try {
    // Try to launch the browser instance
    // Headless access will be disallowed by some sites...
    // https://github.com/Python3WebSpider/WebDriverDetection
    browser = await launch({
      headless: false
    })
  } catch {
    // Exit on failure
    return {
      error: url,
      reason: 'Failed to launch browser instance'
    }
  }

  try {
    // Open the home page
    page = await browser.newPage()
    await page.goto(url)
    await scroll(page)
  } catch (e) {
    // Exit if the page load times-out etc.
    await browser.close()
    return {
      error: url,
      reason: e.message
    }
  }

  /**
   * Retrieve the document language.
   */
  const lang: string = await page.evaluate(() => {
    const element = document.querySelector('HTML')

    if (element instanceof HTMLHtmlElement) {
      return (element.lang || '').trim()
    }

    throw new Error('Html element not found')
  }).catch(() => '')

  /**
   * Retrieve the page title.
   */
  const title: string = await page.evaluate(() => {
    const element = document.querySelector('TITLE')

    if (element instanceof HTMLTitleElement) {
      return (element.textContent || '').trim()
    }

    throw new Error('Title element not found')
  }).catch(() => '')

  /**
   * Retrieve the metadata description and keywords.
   */
  const [ description, keywords ]: string[] = await Promise.all(
    [ 'description', 'keywords' ].map(name => page.evaluate(n => {
      const element = document.querySelector(
        `META[name="${n}" i], META[property*="${n}" i]`
      )

      if (element instanceof HTMLMetaElement) {
        return (element.content || '').trim()
      }

      throw new Error('Meta element not found')
    }, name).catch(() => ''))
  )

  /**
   * For each of `Platforms`, try to scrape corresponding handle for `url`.
   */
  const links: SocialMediaHandle = await Promise.all(
    Object.values(Platforms).map(async platform => {
      const result: SocialMediaHandle = {}

      const href = await page.evaluate((p, d) => {
        let element: HTMLAnchorElement | null = null

        element = document.querySelector(`A[href*="${p}.com/${d}" i]`)

        if (!element) {
          element = document.querySelector(`A[href*="${p}.com" i]`)
        }

        if (element instanceof HTMLAnchorElement) {
          return element.href
        }

        throw new Error(`Social media handle for ${p} not found`)
      }, platform, urlData.sld).catch(() => '')

      result[platform] = href

      return result
    })
  ).then(([first, ...rest]: SocialMediaHandle[]) => {
    return Object.assign(first, ...rest)
  })

  // Close the browser instance
  await browser.close()

  // Write out the data
  return {
    url,
    lang,
    title,
    keywords,
    description,
    socials: JSON.stringify(links)
  }
}
