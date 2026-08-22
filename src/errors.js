// map errors for error_handler

class NotFoundError extends Error {     // task ID doesn’t exist
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

class ValidationError extends Error {   // invalid title/body/query
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class ConflictError extends Error {     // duplicate title
    constructor(message) {
        super(message);
        this.name = 'ConflictError';
    }
}

module.exports = {
    NotFoundError,
    ValidationError,
    ConflictError,
};