## SITE METADATA SCRAPER


### Scrape site metadata for classification and keyword analysis.

- Use [puppeteer](https://pptr.dev/) to run browser instance for scraping.
- Url validation/parsing handled with [psl](https://www.npmjs.com/package/psl).
- Extract basic site metadata:
  1. Html `language` value to guide subsequent analysis
  2. Document `title`
  3. Meta information: `keywords` and `description` if available
  4. Social media handles for major platforms

Service intended to run infrequently e.g. on a monthly basis with build and run
from repository source via e.g. AWS CodeBuild...

### Run

Export variables to the environment:

`<path>`: endpoint for index of url data to iterate on
`<size>`: a reasonable batch size for concurrent browser instances (~5)

`export INPUT_PATH=<path>`
`export BATCH_SIZE=<size>`

Run the service:

`npm run start`
