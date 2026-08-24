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

    router.get("/public/info", (req, res) => {
        const message = "Welcome stranger! This info is public.";
        return res.status(200).json({ message: message });
    });

    router.get("/protected/profile", async (req, res) => {
        const authHeader = req.headers.authorization;

        return res.status(200).json(await authServices.validateHeader(authHeader));
    });

    return router;
}

module.exports = { AuthRoutes };