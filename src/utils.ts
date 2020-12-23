import { Page } from 'puppeteer'

/**
 * Doc.
 */
const scroll = async (page: Page) : Promise<void> => {
  // Scroll to bottom to invoke lazy-loading content
  const n = await page.evaluate(() => {
    return Math.ceil(document.body.scrollHeight / visualViewport.height)
  })
  let i = -1
  while (++i <= n) {
    await page.evaluate(() => window.scrollBy(0, visualViewport.height))
    await page.waitForTimeout(100)
  }
}

export {
  scroll
}
