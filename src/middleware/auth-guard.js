function requireAuth(authServices) {
    return async function (req, res, next) {
        const authHeader = req.headers.authorization;
        req.user = await authServices.validateUser(authHeader);
        next();
    };
}

module.exports = { requireAuth };