
import { Router } from "express";
import localController from "../controllers/localController.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import perfilMiddleware from "../middlewares/perfilMiddleware.js";

// ==========================================
// ROTAS - LOCAIS
// ==========================================
// Define os endpoints HTTP para o cadastro
// e gerenciamento dos locais.

const router = Router();

function autenticarQuandoNecessario(req, res, next) {
    if (process.env.DEMO_MODE === "true") return next();
    return authMiddleware(req, res, next);
}

function exigirAdministradorQuandoNecessario(req, res, next) {
    if (process.env.DEMO_MODE === "true") return next();
    return perfilMiddleware("Administrador")(req, res, next);
}

// ======================================
// SEGURANÇA - AUTENTICAÇÃO OBRIGATÓRIA
// ======================================
// Todas as operações de locais exigem
// um usuário autenticado com JWT.

router.use(autenticarQuandoNecessario);

// Lista todos os locais.
router.get("/", (req, res) =>
    localController.listarTodos(req, res)
);

// Consulta um local pelo ID.
router.get("/:id", (req, res) =>
    localController.buscarPorId(req, res)
);


    // ======================================
    // POST - CADASTRAR LOCAL
    // ======================================
    // Somente Administradores podem cadastrar.
    router.post(
        "/",
        exigirAdministradorQuandoNecessario,
        (req, res) => localController.criar(req, res)
    );

    // ======================================
    // PUT - ATUALIZAR LOCAL
    // ======================================
    // Somente Administradores podem atualizar.
    router.put(
        "/:id",
        exigirAdministradorQuandoNecessario,
        (req, res) => localController.atualizar(req, res)
    );

    // ======================================
    // PATCH - ALTERAR STATUS DO LOCAL
    // ======================================
    // Somente Administradores podem alterar
    // o status de um local.
    router.patch(
        "/:id/status",
        exigirAdministradorQuandoNecessario,
        (req, res) =>
            localController.atualizarStatus(req, res)
    );

export default router;
