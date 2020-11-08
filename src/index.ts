import { data } from '../.snippets/urls.json'
import scrape from './scraper'

// Process the urls (select subset for development...)
const urls: string[] = data.map((url: string) => new URL(url).origin).slice(0, 30)

// Execute the scraper on batches of provided urls
;(async () => {
  let i = 0
  while (i < urls.length) {
    const batch: string[] = urls.slice(i, i + 10)

    console.log('Batch >>>')
    await Promise.all(batch.map(scrape))

    i += 10
  }
})()
