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

module.exports = { BookRecordSchema };