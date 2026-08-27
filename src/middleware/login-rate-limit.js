const rateLimit = require("express-rate-limit");

const loginRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000,   // 10 minutes
    max: 3,                     // 3 attempts per IP per window
    standardHeaders: true,      // adds RateLimit-* response headers
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later." },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json(options.message);
    },
});

module.exports = { loginRateLimit };