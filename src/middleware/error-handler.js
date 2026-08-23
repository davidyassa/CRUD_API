
const { NotFoundError, ValidationError, ConflictError, UnauthorizedError } = require('../errors');

function errorHandler(err, req, res, next) {
    if (err instanceof ValidationError || err.type === "entity.parse.failed") {
        return res.status(400).json({ error: err.message });
    }
    if (err instanceof UnauthorizedError) {
        return res.status(401).json({ error: err.message });
    }
    if (err instanceof NotFoundError) {
        return res.status(404).json({ error: err.message });
    }
    if (err instanceof ConflictError) {
        return res.status(409).json({ error: err.message });
    }

    // catch-all
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { errorHandler };
