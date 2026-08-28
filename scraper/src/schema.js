const { z } = require("zod");

const BookRecordSchema = z.object({
    title: z.string().min(1),
    product_url: z.url(),
    price_text: z.string().min(1),
    price_gbp: z.number().positive(),
    availability_text: z.string().min(1),
    rating_text: z.string().min(1),
    description: z.string().nullable(), // allowed to be null
    source_page: z.url(),
    fetched_at: z.string().min(1),
});

const RunReportSchema = z.object({
    started_at: z.string().min(1),
    duration_ms: z.number().nonnegative(),
    pages_fetched: z.number().int().nonnegative(),
    cache_hits: z.number().int().nonnegative(),
    valid_records: z.number().int().nonnegative(),
    invalid_records: z.number().int().nonnegative(),
    failed_pages: z.number().int().nonnegative(),
    failed_page_details: z.array(
        z.object({
            url: z.string(),
            reason: z.string(),
        })
    ),
});

/**
 * Assembles the run report from raw counters and validates its own shape
 * before returning it — a malformed report throws here, not silently on disk.
 */
function buildRunReport({
    startedAt,
    finishedAt,
    cataloguePagesFetched,
    catalogueCacheHits,
    detailPagesFetched,
    detailCacheHits,
    validRecords,
    errors,
    failedPages,
}) {
    const runReport = {
        started_at: startedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
        pages_fetched: cataloguePagesFetched + detailPagesFetched,
        cache_hits: catalogueCacheHits + detailCacheHits,
        valid_records: validRecords.length,
        invalid_records: errors.length,
        failed_pages: failedPages.length,
        failed_page_details: failedPages,
    };

    return RunReportSchema.parse(runReport);
}

module.exports = {
    BookRecordSchema,
    RunReportSchema,
    buildRunReport,
};