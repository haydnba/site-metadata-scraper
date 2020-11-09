import { parse, ParsedDomain, ParseError } from 'psl'

export default (input: string) : ParsedDomain & URL | undefined => {

  let urlObject: URL
  let domanData: ParsedDomain | ParseError

  try {
    // Try to analyse the url input and parse the domain data
    urlObject = new URL(input)
    domanData = parse(urlObject.hostname)

    if (domanData.error) {
      // There is something wrong with the hostname...
      throw new Error('Invalid hostname: ' + domanData.error.code)
    }

    return {
      ...urlObject,
      ...domanData
    }
  } catch {
    // The input url could not be analysed or parsed
    return undefined
  }

}
