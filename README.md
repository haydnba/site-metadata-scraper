## Site Metadata Scraper

Scrape ecommerce site metadata for classification and keyword analysis.


### Dependencies

- Use [puppeteer](https://pptr.dev/) to run browser instance for scraping.
- Url validation/parsing managed with [public suffix list](https://www.npmjs.com/package/psl).


### Methodology

- Iterate on list of validated urls (input can be origin, hostname, domain name)
- Batch input (~5) with concurrent browser instances to invoke the page
- For each, extract basic site metadata:
  1. Html `lang` value to guide any subsequent analysis
  2. Document `title`
  3. Meta information: `keywords` and `description` if available
  4. Social media handle anchors for major platforms

Service intended to run infrequently e.g. on a monthly basis with build and run
from repository source via e.g. AWS CodeBuild...


### Run

Export variables to the environment:

> `<path>`: endpoint for index of url data to iterate on <br/>
> `<size>`: a reasonable batch size for concurrent browser instances (~5)

`export INPUT_PATH=<path>` <br/>
`export BATCH_SIZE=<size>`

Run the service:

`npm run start`


### TODO

Dockerise to run headful puppeteer in container with xvfb.
