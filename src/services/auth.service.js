const { ValidationError, UnauthorizedError } = require("../errors");

function AuthServices(supabase) {

    async function signUp({ email, password }) {
        if (!email || !password) {
            throw new ValidationError("Email and password are required");
        }

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw new ValidationError(error.message);

        return data.user;
    }

    async function login({ email, password }) {
        if (!email || !password) {
            throw new ValidationError("Email and password are required");
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new UnauthorizedError("Invalid login credentials");

        return {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
        };
    }

    async function validateUser(authHeader) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("Access token required");
        }

        const token = authHeader.split(" ")[1]; // [Bearer, token]

        if (!token) throw new UnauthorizedError("Access token required");

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) throw new UnauthorizedError("Invalid or expired token");

        const { id, email, created_at, last_sign_in_at } = user;

        return {
            message: "authorized",
            user_id: id,
            user_email: email,
            last_sign_in_at,
            account_creation_date: created_at,
        };
    }

    return {
        signUp,
        login,
        validateUser,
    };
}

module.exports = { AuthServices };