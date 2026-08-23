const express = require("express");

function AuthRoutes(authServices) {
    const router = express.Router();

    router.post("/auth/signup", async (req, res) => {
        const { email, password } = req.body;
        const user = await authServices.signUp({ email, password });
        return res.status(201).json({ user });
    });

    router.post("/auth/login", async (req, res) => {
        const { email, password } = req.body;
        const tokens = await authServices.login({ email, password });
        return res.status(200).json(tokens);
    });

    return router;
}

module.exports = { AuthRoutes };