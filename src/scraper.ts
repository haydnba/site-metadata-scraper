import parse from './url'
import { Browser, Page, launch as browserLaunch } from 'puppeteer'

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

export default async (url: string) : Promise<void> => {

  /**
   * Validate and analyse the url.
   *
   * https://www.npmjs.com/package/psl
   */

  const urlData = parse(url)

  if (!urlData) {
    // Exit if there is invalid url
    return
  }

  const { domain, sld } = urlData

  /**
   * Launch the browser instance and load page tabs.
   *
   * https://pptr.dev/#?product=Puppeteer&version=v5.4.1&show=api-puppeteerlaunchoptions
   * https://pptr.dev/#?product=Puppeteer&version=v5.4.1&show=api-browsernewpage
   * https://pptr.dev/#?product=Puppeteer&version=v5.4.1&show=api-pagegotourl-options
   */

  let browser: Browser
  let page: Page

  try {
    // Try to launch the browser instance
    // Headless access will be disallowed by some sites...
    // https://github.com/Python3WebSpider/WebDriverDetection
    browser = await browserLaunch({
      // headless: false
    })
  } catch {
    // Exit on failure
    return
  }

  try {
    // Open the home page
    page = await browser.newPage()
    await page.goto(url)

    // // Set to desktop view
    // await page.setViewport({ width: 1280, height: 720 })

    // Scroll to bottom to invoke lazy-loading content
    const n = await page.evaluate(() => {
      return Math.ceil(document.body.scrollHeight / visualViewport.height)
    })
    let i = 0
    while (i <= n) {
      await page.evaluate(() => window.scrollBy(0, visualViewport.height))
      await page.waitForTimeout(100)
      i++
    }
  } catch (e) {
    // Exit if the page load times-out etc.
    await browser.close()
    return
  }

  /**
   * Evaluating JS in the page context.
   *
   * https://pptr.dev/#?product=Puppeteer&version=v5.4.1&show=api-pageevaluatepagefunction-args
   */

  // Retrieve the page title
  const lang: string = await page.evaluate(() => {
    const element = document.querySelector('HTML')

    if (element instanceof HTMLHtmlElement) {
      return (element.lang || '').trim()
    }

    throw new Error('Html element not found')
  }).catch(() => '')

  // Retrieve the page title
  const title: string = await page.evaluate(() => {
    const element = document.querySelector('TITLE')

    if (element instanceof HTMLTitleElement) {
      return (element.textContent || '').trim()
    }

    throw new Error('Title element not found')
  }).catch(() => '')

  //  Retrieve the metadata description and keywords
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

  // For each of `Platforms`, try to scrape corresponding handle for `url`
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
      }, platform, sld).catch(() => '')

      result[platform] = href

      return result
    })
  ).then(([first, ...rest]: SocialMediaHandle[]) => {
    return Object.assign(first, ...rest)
  })

  // Close the browser instance
  // await browser.close()

  // Write out the data - could be serialised as JSON...
  console.log({
    domain,
    url,
    lang,
    title,
    description,
    keywords,
    links
  })

  return
}
