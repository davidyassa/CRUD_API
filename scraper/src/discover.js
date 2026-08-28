const cheerio = require("cheerio");
const { fetchWithCache } = require("./fetcher");

const BASE_CATALOGUE_URL = "https://books.toscrape.com/catalogue/page-1.html";
const DELAY_MS = 500;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pull every book link and the "next page" link out of one catalogue page's HTML
 * Returns absolute URLs instead of relative ones
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
    const nextUrl = nextRelativeHref ? new URL(nextRelativeHref, pageUrl).href : null;

    return { bookUrls, nextUrl };
}

/**
 * Walk catalogue pages starting at BASE_CATALOGUE_URL, following the site's own
 * "next" link, until there is no next link or we've collected 3 pages.
 * Returns a deduplicated list of absolute book URLs.
 */
async function discoverBookUrls() {
    const allBookUrls = new Set();
    let currentUrl = BASE_CATALOGUE_URL;
    let pageCount = 0;

    while (currentUrl && pageCount < 3) {
        const cachePath = `cache/catalogue-page-${pageCount + 1}.html`;
        const { html, fromCache } = await fetchWithCache(currentUrl, cachePath);

        const { bookUrls, nextUrl } = parseCataloguePage(html, currentUrl);
        bookUrls.forEach((url) => allBookUrls.add(url));

        pageCount++;
        currentUrl = nextUrl;

        if (!fromCache && currentUrl) {
            await sleep(DELAY_MS);
        }
    }

    console.log(`catalogue_pages=${pageCount} discovered=${allBookUrls.size} unique_urls=${allBookUrls.size}`);
    return Array.from(allBookUrls);
}

module.exports = {
    discoverBookUrls,
    parseCataloguePage,
};