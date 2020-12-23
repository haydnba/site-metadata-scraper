import read from './read'
import scrape from './scraper'
import { compose } from './url'

interface IndexItem {
  id: number
  url: string
  merchant: {
    [k: string]:  string
  }
}

const { INPUT_PATH } = process.env
const { BATCH_SIZE } = process.env

/**
 * Execute the scraper on batches of processed urls
 */
;(async () => {
  // Contain the result
  const result: Array<{ [k: string]: string }> = []

  // Get the input
  const urls: string[] = await read(INPUT_PATH || '')
    .then(data => (data as IndexItem[]).map(d => compose(d.url)))
    .catch(() => [])

  // Unslice for prod...
  const list: string[] = urls.slice(0, 10)

  // Iterate on batches
  let [ i, c ] = [ 0, 0 ]
  const partition = Number(BATCH_SIZE) || 5
  while (i < list.length) {
    const batch: string[] = list.slice(i, i + partition)

    console.info(`<<< Batch ${++c} [${batch.length}] >>>`)
    const data = await Promise.all(batch.map(scrape))

    result.push(...data)

    i += partition
  }

  console.log(result)
})()
