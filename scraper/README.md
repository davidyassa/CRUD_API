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
once on 2026-08-27. The request returned **404 Not Found** — no robots file
found. A missing file is not permission by itself, but combined with the
site's own stated purpose as a scraping sandbox, scraping the public
catalogue here is appropriate.

**Why this is appropriate here:** The target explicitly exists for this
purpose, only public catalogue pages are touched, requests are rate-limited
and identify the scraper honestly (see Stage 1), and no data beyond what's
publicly displayed on the page is collected.

I will not reuse this code on another site without checking its rules and
terms first.

## Project layout

```
scraper/
├── README.md
├── .gitignore
├── src/
│   └── index.js       # entry point
├── cache/             # saved HTML responses (gitignored, created at runtime)
└── output/            # books.json + run-report.json (gitignored, created at runtime)
```

## Setup

```bash
cd scraper
npm init -y
node src/index.js
```

No database, paid proxy, cloud account, or credit card is required.