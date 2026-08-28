const {
    existsSync,
    readFileSync,
    writeFileSync,
    mkdirSync,
} = require("fs");

const { dirname } = require("path");

const USER_AGENT = "FlyRankInternship-A9/1.0 (+https://github.com/davidyassa/CRUD_API)";
const TIMEOUT_MS = 5000;
const RETRY_DELAY_MS = 1000;

/**
 * A fetch failure that knows whether it is worth retrying.
 * - 404 / 403 -> retryable: false. The page will not exist, or the site will
 *   not let you in, no matter how many times you ask again.
 * - timeouts, 5xx, other network errors -> retryable: true. Transient.
 */
class FetchError extends Error {
    constructor(message, { status = null, retryable }) {
        super(message);
        this.name = "FetchError";
        this.status = status;
        this.retryable = retryable;
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** One raw network attempt: header, timeout, status check. No retry, no cache. */
async function fetchOnce(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT },
            signal: controller.signal,
        });

        if (!response.ok) {
            const isPermanent = response.status === 404 || response.status === 403;
            throw new FetchError(
                `FETCH FAILED ${response.status} ${response.statusText}: ${url}`,
                { status: response.status, retryable: !isPermanent }
            );
        }

        return response;
    } catch (error) {
        if (error instanceof FetchError) {
            throw error;
        }

        if (error.name === "AbortError") {
            throw new FetchError(`FETCH TIMEOUT after ${TIMEOUT_MS}ms: ${url}`, {
                retryable: true,
            });
        }

        // DNS failure, connection refused, etc. Treat as transient.
        throw new FetchError(error.message, { retryable: true });
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * One attempt, and -- only for retryable failures -- exactly one retry after
 * a short wait. 404 / 403 fail immediately, no retry (see FetchError above).
 */
async function fetchWithRetry(url) {
    try {
        return await fetchOnce(url);
    } catch (error) {
        if (!error.retryable) {
            throw error;
        }

        console.log(`RETRY ${url} — ${error.message}`);
        await sleep(RETRY_DELAY_MS);
        return await fetchOnce(url); // a second failure here propagates as-is
    }
}

async function fetchWithCache(url, cachePath) {
    if (existsSync(cachePath)) {
        const html = readFileSync(cachePath, "utf-8");
        console.log(`CACHE HIT ${cachePath} — ${html.length} bytes`);
        return { html, fromCache: true };
    }

    const response = await fetchWithRetry(url);
    const html = await response.text();

    mkdirSync(dirname(cachePath), { recursive: true });
    writeFileSync(cachePath, html, "utf-8");

    console.log(`FETCH ${url} — ${response.status} — ${html.length} bytes`);

    return { html, fromCache: false };
}

module.exports = {
    fetchWithCache,
    FetchError,
};
