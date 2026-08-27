const {
    existsSync,
    readFileSync,
    writeFileSync,
    mkdirSync,
} = require("fs");

const { dirname } = require("path");

const USER_AGENT = "FlyRankInternship-A9/1.0 (+https://github.com/davidyassa/CRUD_API)";
const TIMEOUT_MS = 5000;

async function fetchWithCache(url, cachePath) {
    // --- 1. Cache check ---
    if (existsSync(cachePath)) {
        const html = readFileSync(cachePath, "utf-8");
        console.log(`CACHE HIT ${cachePath} — ${html.length} bytes`);
        return html;
    }

    // --- 2. Network fetch, with a timeout guard ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response;
    try {
        response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT },
            signal: controller.signal,
        });
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(`FETCH TIMEOUT after ${TIMEOUT_MS}ms: ${url}`);
        }
        throw error; // some other network failure (DNS, connection refused, etc.)
    } finally {
        clearTimeout(timeoutId);
    }

    // --- 3. Status check BEFORE trusting the body ---
    if (!response.ok) {
        throw new Error(`FETCH FAILED ${response.status} ${response.statusText}: ${url}`);
    }

    const html = await response.text();

    // --- 4. Save to cache for next time ---
    mkdirSync(dirname(cachePath), { recursive: true });
    writeFileSync(cachePath, html, "utf-8");

    console.log(`FETCH ${url} — ${response.status} — ${html.length} bytes`);

    return html;
}

module.exports = {
    fetchWithCache,
}