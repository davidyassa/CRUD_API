const { mkdirSync, writeFileSync } = require("fs");
const { discoverBookUrls } = require("./discover");
const { fetchWithCache } = require("./fetcher");
const { parseBookDetailPage } = require("./extract");
const { validateRecords } = require("./validate");

const DELAY_MS = 500;
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function main() {
    const books = await discoverBookUrls();
    const rawRecords = [];

    for (let i = 0; i < books.length; i++) {
        const { url, sourcePage } = books[i];
        const cachePath = `cache/book-${i}.html`;
        const { html, fromCache } = await fetchWithCache(url, cachePath);
        rawRecords.push(parseBookDetailPage(html, url, sourcePage));
        if (!fromCache) await sleep(DELAY_MS);
    }

    const { validRecords, errors } = validateRecords(rawRecords);

    mkdirSync("output", { recursive: true });
    writeFileSync("output/books.json", JSON.stringify(validRecords, null, 2), "utf-8");
    if (errors.length > 0) {
        writeFileSync("output/errors.json", JSON.stringify(errors, null, 2), "utf-8");
    }

    console.log(`valid_records=${validRecords.length} invalid_records=${errors.length}`);
}

main();