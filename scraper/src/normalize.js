/**
 * "£51.77" -> 51.77. Strips everything that isn't a digit or a decimal point.
 * `^0-9.` === `everything except 0→9 and decimal point`
 * `g` === all matches, not just the first
 * `.replace(this, that);` replace this with that
 */
function parsePriceGbp(priceText) {
    const numeric = priceText.replace(/[^0-9.]/g, "");
    return Number(numeric);
}

function normalizeRecord(rawRecord) {
    return {
        ...rawRecord,
        price_gbp: parsePriceGbp(rawRecord.price_text),
    };
}

module.exports = {
    normalizeRecord,
    parsePriceGbp,
};