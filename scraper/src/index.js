const { fetchWithCache } = require("./fetcher");

const CATALOGUE_PAGE_1 = "https://books.toscrape.com/catalogue/page-1.html";
const CACHE_PATH = "cache/catalogue-page-1.html";

async function main() {
    try {
        await fetchWithCache(CATALOGUE_PAGE_1, CACHE_PATH);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

main();