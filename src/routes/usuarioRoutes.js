
import { Router } from "express";

import usuarioController from "../controllers/usuarioController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import perfilMiddleware from "../middlewares/perfilMiddleware.js";

// ==========================================
// WATT VISION - ROTAS DE USUÁRIOS
// ==========================================

const router = Router();

// Todas as rotas exigem autenticação JWT.
router.use(authMiddleware);

// Qualquer usuário ativo pode alterar a própria senha.
router.patch(
    "/me/senha",
    (req, res) => usuarioController.alterarMinhaSenha(req, res)
);

// GET - Listar usuários.
// Apenas Administrador.
router.get(
    "/",
    perfilMiddleware("Administrador"),
    (req, res) => usuarioController.listarTodos(req, res)
);

// GET - Listar usuários por empresa.
router.get(
    "/empresa/:idEmpresa",
    perfilMiddleware("Administrador"),
    (req, res) => usuarioController.listarPorEmpresa(req, res)
);

// GET - Consultar usuário por ID.
router.get(
    "/:id",
    perfilMiddleware("Administrador"),
    (req, res) => usuarioController.buscarPorId(req, res)
);

// POST - Cadastrar usuário.
router.post(
    "/",
    perfilMiddleware("Administrador"),
    (req, res) => usuarioController.criar(req, res)
);

// PUT - Atualizar usuário.
router.put(
    "/:id",
    perfilMiddleware("Administrador"),
    (req, res) => usuarioController.atualizar(req, res)
);

// PATCH - Ativar ou inativar usuário.
router.patch(
    "/:id/status",
    perfilMiddleware("Administrador"),
    (req, res) => usuarioController.atualizarStatus(req, res)
);

// Somente Administrador pode redefinir a senha de outro usuário.
router.patch(
    "/:id/senha",
    perfilMiddleware("Administrador"),
    (req, res) => usuarioController.redefinirSenha(req, res)
);


 // ======================================
 // POST - AUTORIZAR GESTOR EM UM LOCAL
 // ======================================
 // Somente o Administrador pode conceder
 // acesso de um Gestor a determinado local.
 //
 // Exemplo:
 // POST /api/usuarios/5/locais/2
 //
 // 5 = ID do Gestor
 // 2 = ID do local autorizado

 router.post(
     "/:idUsuario/locais/:idLocal",
     perfilMiddleware("Administrador"),
     (req, res) => usuarioController.autorizarLocal(req, res)
 );



 // ======================================
 // GET - CONSULTAR LOCAIS AUTORIZADOS
 // ======================================
 // Somente Administradores podem consultar
 // as autorizações de qualquer usuário.

 router.get(
     "/:idUsuario/locais",
     perfilMiddleware("Administrador"),
     (req, res) =>
         usuarioController.listarLocaisAutorizados(req, res)
 );


export default router;
