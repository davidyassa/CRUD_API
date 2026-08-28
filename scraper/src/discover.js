const cheerio = require("cheerio");
const { fetchWithCache } = require("./fetcher");

const BASE_CATALOGUE_URL = "https://books.toscrape.com/catalogue/page-1.html";
const DELAY_MS = 500;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pull every book link and the "next page" link out of one catalogue page's HTML.
 * Returns absolute URLs — never relative ones.
 */
function parseCataloguePage(html, pageUrl) {
    const $ = cheerio.load(html);

    const bookUrls = [];
    $("article.product_pod h3 a").each((i, el) => {
        const relativeHref = $(el).attr("href");
        const absoluteUrl = new URL(relativeHref, pageUrl).href;
        bookUrls.push(absoluteUrl);
    });

    const nextRelativeHref = $("li.next a").attr("href"); // undefined on the last page
    const nextUrl = nextRelativeHref
        ? new URL(nextRelativeHref, pageUrl).href
        : null;

    return { bookUrls, nextUrl };
}

/**
 * Walk catalogue pages starting at BASE_CATALOGUE_URL, following the site's own
 * "next" link, until there is no next link or we've collected 3 pages.
 *
 * Returns { books, pagesFetched, cacheHits, failedPages }. books is
 * { url, sourcePage }[], deduplicated by url via a Map. The other three
 * fields feed Stage 5's run-report.json directly.
 */
async function discoverBookUrls() {
    const bookUrlToSourcePage = new Map();
    const failedPages = [];
    let pagesFetched = 0;
    let cacheHits = 0;

    let currentUrl = BASE_CATALOGUE_URL;
    let pageCount = 0;

    while (currentUrl && pageCount < 3) {
        const cachePath = `cache/catalogue-page-${pageCount + 1}.html`;

        let html;
        let fromCache;
        try {
            ({ html, fromCache } = await fetchWithCache(currentUrl, cachePath));
        } catch (error) {
            console.error(`SKIP ${currentUrl} — ${error.message}`);
            failedPages.push({ url: currentUrl, reason: error.message });
            break; // no HTML means no next link either — discovery stops here
        }

        pagesFetched += 1;
        if (fromCache) {
            cacheHits += 1;
        }

        const { bookUrls, nextUrl } = parseCataloguePage(html, currentUrl);
        bookUrls.forEach((url) => {
            if (!bookUrlToSourcePage.has(url)) {
                bookUrlToSourcePage.set(url, currentUrl);
            }
        });

        pageCount += 1;
        currentUrl = nextUrl;

        if (!fromCache && currentUrl) {
            await sleep(DELAY_MS);
        }
    }

    const books = Array.from(bookUrlToSourcePage, ([url, sourcePage]) => ({
        url,
        sourcePage,
    }));

    console.log(
        `catalogue_pages=${pageCount} discovered=${books.length} unique_urls=${books.length}`
    );

    return { books, pagesFetched, cacheHits, failedPages };
}

module.exports = { discoverBookUrls, parseCataloguePage };
