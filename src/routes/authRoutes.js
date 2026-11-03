
import { Router } from "express";

import authController from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

// ==========================================
// WATT VISION - ROTAS DE AUTENTICAÇÃO
// ==========================================

const router = Router();

// POST - Login público.
// Não exige token, pois é utilizado
// para iniciar a sessão.
router.post("/login", (req, res) =>
    authController.login(req, res)
);

// GET - Consultar usuário autenticado.
// Exige um token JWT válido.
router.get("/me", authMiddleware, (req, res) => {

    return res.status(200).json({
        sucesso: true,
        mensagem: "Usuário autenticado com sucesso.",
        dados: req.usuario
    });
});

export default router;
