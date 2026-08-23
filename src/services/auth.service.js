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

    return { signUp, login };
}

module.exports = { AuthServices };