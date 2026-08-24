const express = require("express");
const { requireAuth } = require("../middleware/auth-guard");

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

    const guard = requireAuth(authServices);

    router.get("/protected/profile", guard, async (req, res) => {
        return res.status(200).json(req.user);
    });

    router.get("/protected/dashboard", guard, async (req, res) => {
        return res.status(200).json({ message: "Dashboard", user: req.user });
    });

    router.post("/auth/logout", guard, async (req, res) => {
        await authServices.logout();
        return res.status(204).send();
    });

    return router;
}

module.exports = { AuthRoutes };