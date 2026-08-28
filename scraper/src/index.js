const { mkdirSync, writeFileSync } = require("fs");
const { discoverBookUrls } = require("./discover");
const { fetchWithCache } = require("./fetcher");
const { parseBookDetailPage } = require("./extract");
const { validateRecords } = require("./validate");
const { buildRunReport } = require("./schema");
const DELAY_MS = 500;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}



async function main() {
    const startedAt = new Date();

    const {
        books,
        pagesFetched: cataloguePagesFetched,
        cacheHits: catalogueCacheHits,
        failedPages: catalogueFailedPages,
    } = await discoverBookUrls();

    // // To test a failed page
    // const FAKE_BOOK_URL =
    //     "https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html";
    // books.push({ url: FAKE_BOOK_URL, sourcePage: "manual-test" });

    let detailPagesFetched = 0;
    let detailCacheHits = 0;
    const failedPages = [...catalogueFailedPages];
    const rawRecords = [];

    for (let i = 0; i < books.length; i++) {
        const { url, sourcePage } = books[i];
        const cachePath = `cache/book-${i}.html`;

        try {
            const { html, fromCache } = await fetchWithCache(url, cachePath);
            detailPagesFetched += 1;
            if (fromCache) {
                detailCacheHits += 1;
            }

            rawRecords.push(parseBookDetailPage(html, url, sourcePage));

            if (!fromCache) {
                await sleep(DELAY_MS);
            }
        } catch (error) {
            console.error(`SKIP ${url} — ${error.message}`);
            failedPages.push({ url, reason: error.message });
        }
    }

    const { validRecords, errors } = validateRecords(rawRecords);

    mkdirSync("output", { recursive: true });
    writeFileSync("output/books.json", JSON.stringify(validRecords, null, 2), "utf-8");
    if (errors.length > 0) {
        writeFileSync("output/errors.json", JSON.stringify(errors, null, 2), "utf-8");
    }

    const finishedAt = new Date();
    const runReport = buildRunReport({
        startedAt,
        finishedAt,
        cataloguePagesFetched,
        catalogueCacheHits,
        detailPagesFetched,
        detailCacheHits,
        validRecords,
        errors,
        failedPages,
    });
    writeFileSync("output/run-report.json", JSON.stringify(runReport, null, 2), "utf-8");

    console.log(
        `valid_records=${validRecords.length} invalid_records=${errors.length} failed_pages=${failedPages.length}`
    );
}

main();
