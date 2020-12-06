// https://www.npmjs.com/package/psl
import { parse, ParsedDomain, ParseError } from 'psl'

/**
 * Safely construct an origin from more-or-less partial hostname.
 */
const construct = (input: string) : string => {
  let domainData: ParsedDomain | ParseError

  try {
    // Try to parse the input
    domainData = parse(input)

    if (domainData.error) {
      // There is something wrong with the input...
      throw new Error('Invalid input: ' + domainData.error.code)
    }

    const { domain, subdomain } = domainData

    return `https://${subdomain || 'www'}.${domain}`
  } catch {
    // The input could not be parsed
    return ''
  }
}

/**
 * Safely decompose a valid url to its elements.
 */
const decompose = (input: string) : ParsedDomain & URL | undefined => {

  let urlObject: URL
  let domainData: ParsedDomain | ParseError

  try {
    // Try to analyse the url input and parse the domain data
    urlObject = new URL(input)
    domainData = parse(urlObject.hostname)

    if (domainData.error) {
      // There is something wrong with the hostname...
      throw new Error('Invalid hostname: ' + domainData.error.code)
    }

    return {
      ...urlObject,
      ...domainData
    }
  } catch {
    // The input url could not be analysed or parsed
    return undefined
  }

}

export {
  construct,
  decompose
}
