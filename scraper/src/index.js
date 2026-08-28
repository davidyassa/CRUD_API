const { discoverBookUrls } = require("./discover");
const { fetchWithCache } = require("./fetcher");
const { parseBookDetailPage } = require("./extract");

const DELAY_MS = 500;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    const books = await discoverBookUrls(); // [{ url, sourcePage }, ...]
    const records = [];

    for (let i = 0; i < books.length; i++) {
        const { url, sourcePage } = books[i];
        const cachePath = `cache/book-${i}.html`;

        const { html, fromCache } = await fetchWithCache(url, cachePath);
        const record = parseBookDetailPage(html, url, sourcePage);
        records.push(record);

        if (!fromCache) {
            await sleep(DELAY_MS);
        }
    }

    console.log(records[0]);
    console.log(`detail_pages=${records.length}`);
}

main();