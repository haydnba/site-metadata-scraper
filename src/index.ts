import { Browser, Page, launch as browserLaunch } from 'puppeteer'
import { data } from '../.snippets/urls.json'

// Process the urls (select subset for development...)
const urls: string[] = data.map((url: string) => new URL(url).origin)//.slice(0, 10)

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

const scrape = async (list: string[]) => await Promise.all(list.map(async (url: string) => {

  let browser: Browser
  let page: Page

  /**
   * Launching the browser instance.
   *
   * https://pptr.dev/#?product=Puppeteer&version=v5.4.1&show=api-puppeteerlaunchoptions
   */

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

  /**
   * Loading browser tabs.
   *
   * https://pptr.dev/#?product=Puppeteer&version=v5.4.1&show=api-browsernewpage
   * https://pptr.dev/#?product=Puppeteer&version=v5.4.1&show=api-pagegotourl-options
   */

  try {
    // Open the home page
    page = await browser.newPage()
    await page.goto(url)

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
      const element = document.querySelector(`META[name="${n}" i]`)

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

      const href = await page.evaluate(p => {
        const element = document.querySelector(`A[href*="${p}.com" i]`)

        if (element instanceof HTMLAnchorElement) {
          return element.href
        }

        throw new Error(`Social media handle for ${p} not found`)
      }, platform).catch(() => '')

      result[platform] = href

      return result
    })
  ).then(([first, ...rest]: SocialMediaHandle[]) => {
    return Object.assign(first, ...rest)
  })

  // Close the browser instance
  await browser.close()

  // Write out the data - could be serialised as JSON...
  console.log({
    title,
    description,
    keywords,
    links
  })

}))

// Execute the scraper on batches of provided urls
;(async () => {
  for (let i = 0; i < urls.length; i += 10) {
    const batch: string[] = urls.slice(i, i + 10)

    console.log('Starting Batch!!')
    await scrape(batch)
    console.log('Finishing Batch!!')
  }
})()
