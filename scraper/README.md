# The Polite Scraper — Books to Scrape

A small, polite scraping pipeline that downloads the first three catalogue
pages of [Books to Scrape](https://books.toscrape.com), visits all 60 book
pages, and turns the messy HTML into clean, schema-validated JSON records —
without hammering the site, and without trusting anything it reads.

Stack: **Node.js**, built-in `fetch`, **Cheerio** for HTML parsing, **Zod**
for schema validation.

## Target classification

**Site:** [books.toscrape.com](https://books.toscrape.com)

**Why this site:** Books to Scrape is a sandbox built specifically for
scraping practice. Its parent site, [toscrape.com](https://toscrape.com),
describes it as "a fictional bookstore that desperately wants to be
scraped" — an explicit invitation to automated access, not a live commercial
store. It is the only kind of site this assignment (or this scraper) touches.

**Scope:** The first 3 catalogue pages only (`page-1.html` through
`page-3.html`, followed via the site's own "next" link — never hardcoded),
and the 60 individual book detail pages those catalogue pages link to.

**Data collected:** Per book — title, product URL, price text, availability
text, star rating text, description, plus provenance fields (source catalogue
page, fetch timestamp). No personal data, no account data, and nothing
outside the public catalogue is touched.

**`robots.txt` result:** Requested `https://books.toscrape.com/robots.txt`
once. The request returned **404 Not Found** — no robots file found. A
missing file is not permission by itself, but combined with the site's own
stated purpose as a scraping sandbox, scraping the public catalogue here is
appropriate.

**Why this is appropriate here:** The target explicitly exists for this
purpose, only public catalogue pages are touched, requests are rate-limited
and identify the scraper honestly, and no data beyond what's publicly
displayed on the page is collected.

I will not reuse this code on another site without checking its rules and
terms first.

## Lane & install

JavaScript lane — Node.js, CommonJS (`require`/`module.exports`).

```bash
cd scraper
npm install
```

## Run it

```bash
node src/index.js
```

This produces `output/books.json` and `output/run-report.json`. Deleting
`cache/` before a run forces fresh fetches instead of reading cached HTML.

## Record schema

Every record in `books.json` is validated against this shape (`src/schema.js`,
enforced with Zod) before it's ever written to disk. A record that fails
lands in `output/errors.json` with a reason instead — it never enters
`books.json`.

| Field               | Type              | Notes                                                    |
| ------------------- | ----------------- | -------------------------------------------------------- |
| `title`             | string            | non-empty                                                |
| `product_url`       | string (URL)      | the record's identity — deduplicated on this             |
| `price_text`        | string            | raw, as scraped, e.g. `"£51.77"`                         |
| `price_gbp`         | number            | parsed from `price_text`, kept alongside it              |
| `availability_text` | string            | raw stock text                                           |
| `rating_text`       | string            | e.g. `"Three"` — read from a CSS class, not text content |
| `description`       | string \| null    | `null` when the source page has no description block     |
| `source_page`       | string (URL)      | which catalogue page this book was discovered on         |
| `fetched_at`        | string (ISO 8601) | timestamp of the detail-page fetch                       |

## Politeness rules

- **User-Agent:** every request identifies itself honestly —
  `FlyRankInternship-A9/1.0 (+https://github.com/davidyassa/CRUD_API)` — never
  spoofed as a browser.
- **Delay:** 500ms between real (non-cached) requests.
- **Timeout:** 5s per request, enforced with `AbortController`.
- **Cache-first:** every URL is checked against `cache/` before any network
  call; a second run of the whole pipeline makes zero real requests.
- **Retry:** transient failures (timeouts, 5xx) get exactly one retry after a
  short wait. `404` and `403` are never retried — retrying a missing page
  won't create it, and retrying a block is how a polite scraper stops being
  polite.
- **Fail-soft:** one broken page is logged and skipped; it doesn't stop the
  other 59.

## Sample run report

```json
{
  "started_at": "2026-08-28T23:24:57.059Z",
  "duration_ms": 46197,
  "pages_fetched": 63,
  "cache_hits": 0,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 1,
  "failed_page_details": [
    {
      "url": "https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html",
      "reason": "FETCH FAILED 404 Not Found: https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html"
    }
  ]
}
```

## Why this needed no browser

The book data — title, price, availability, description — is already present
in the raw HTML the server sends on first request; nothing is rendered
client-side by JavaScript, so a headless browser would only add cost with no
benefit here.

## Ethics note

This scraper only targets a site built explicitly for scraping practice, and
that boundary is load-bearing, not incidental — the same code should not be
pointed at a real store without separately checking its terms and `robots.txt`
first. In general: prefer an official API if one exists, never bypass a
login, paywall, or explicit block, and only collect the fields the task
actually needs — not everything a page happens to expose.

## Known limitation

Retry logic is a single fixed-delay retry, not real backoff — a page that's
slow to recover from a 5xx (rather than instantly available again after 1s)
will still be marked failed. Stretch/next-week work: exponential backoff with
jitter and respecting `Retry-After`.

## Project layout
scraper/  
├── README.md  
├── .gitignore  
├── package.json  
├── src/  
│ ├── index.js # entry point — orchestrates the run, writes output  
│ ├── fetcher.js # cache-first fetch, timeout, single retry  
│ ├── discover.js # catalogue pagination + book URL discovery  
│ ├── extract.js # raw field extraction from a book detail page  
│ ├── normalize.js # price_text -> price_gbp  
│ ├── schema.js # Zod schemas + run-report builder  
│ └── validate.js # bulk validation, good/bad record split  
├── cache/ # saved HTML responses (gitignored)  
└── output/ # books.json + run-report.json (committed)  
