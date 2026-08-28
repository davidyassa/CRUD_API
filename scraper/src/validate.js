const { BookRecordSchema } = require("./schema");
const { normalizeRecord } = require("./normalize");

/**
 * Normalize + validate every raw record. Good ones are keyed by product_url
 * in a Map — that's the "canonical identity" rule: if the same URL somehow
 * appears twice, the second write just overwrites the first, so the output
 * count still can't exceed unique books.
 */
function validateRecords(rawRecords) {
    const validByUrl = new Map();
    const errors = [];

    for (const raw of rawRecords) {
        const normalized = normalizeRecord(raw);
        const result = BookRecordSchema.safeParse(normalized);

        if (result.success) {
            validByUrl.set(result.data.product_url, result.data);
        } else {
            errors.push({
                product_url: raw.product_url ?? null,
                reason: result.error.issues
                    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                    .join("; "),
            });
        }
    }

    return { validRecords: Array.from(validByUrl.values()), errors };
}

module.exports = { validateRecords };