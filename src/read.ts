import { get } from 'https'

/**
 * `https.get` wrapped in Promise.
 */
export default (url: string) : Promise<unknown> => {
  return new Promise((resolve, reject) => {
    let body = ''
    get(url, (res) => {

      res
        .on('data', d => body += d)
        .on('end', () => resolve(JSON.parse(body)))

    }).on('error', reject)
  })
}
