const cheerio = require("cheerio");

/**
 * Pull the raw, unmodified fields off one book detail page.
 * No number parsing, no cleanup — that's Stage 4's job.
 * Returns null for description when the page has none; never invents text.
 */
function parseBookDetailPage(html, detailUrl, sourcePage) {
    const $ = cheerio.load(html);
    const main = $(".product_main"); // scope every selector to this, not the whole doc

    const title = main.find("h1").text().trim();
    const priceText = main.find(".price_color").text().trim();
    const availabilityText = main.find(".availability").text().trim().replace(/\s+/g, " ");

    // Rating lives in the class list, not the text: class="star-rating Three"
    const ratingClasses = main.find(".star-rating").attr("class"); // "star-rating Three"
    const ratingText = ratingClasses
        ? ratingClasses.split(" ").filter((cls) => cls !== "star-rating")[0]
        : null;

    // Description: the <p> right after #product_description — may not exist
    const descriptionEl = $("#product_description").next("p");
    const description = descriptionEl.length ? descriptionEl.text().trim() : null;

    return {
        title,
        product_url: detailUrl,
        price_text: priceText,
        availability_text: availabilityText,
        rating_text: ratingText,
        description,
        source_page: sourcePage,
        fetched_at: new Date().toISOString(),
    };
}

module.exports = { parseBookDetailPage };