
import { Router } from "express";

// ==========================================
// WATT VISION - IMPORTAÇÃO DAS ROTAS
// ==========================================
// Cada módulo possui seu próprio arquivo
// de rotas, Controller, Service e Repository.

// Rotas responsáveis pelos registros
// de consumo e grandezas elétricas.
import medicaoRoutes from "./medicaoRoutes.js";

// Rotas de gerenciamento dos locais
// pertencentes às empresas cadastradas.
import localRoutes from "./localRoutes.js";

// Rotas de gerenciamento dos setores
// vinculados aos locais.
import setorRoutes from "./setorRoutes.js";

// Rotas de cadastro e gerenciamento
// dos equipamentos monitorados.
import equipamentoRoutes from "./equipamentoRoutes.js";

// Rotas dos pontos que associam dispositivos
// IoT a locais, setores ou equipamentos.
import pontoMedicaoRoutes from "./pontoMedicaoRoutes.js";

// Rotas de cadastro e gerenciamento dos
// dispositivos ESP32 do Watt Vision.
import dispositivoIotRoutes from "./dispositivoIotRoutes.js";

// ==========================================
// NOVO MÓDULO - SENSORES PZEM
// ==========================================
// Importa os endpoints responsáveis pelo
// gerenciamento dos sensores PZEM-004T.
import pzemRoutes from "./pzemRoutes.js";



// Rotas de gerenciamento de empresas
import empresaRoutes from "./empresaRoutes.js";



// Rotas de gerenciamento de tarifas de energia
import tarifaRoutes from "./tarifaRoutes.js";


// Rotas de limites de monitoramento
import limiteRoutes from "./limiteRoutes.js";


// Rotas de gerenciamento de alertas
import alertaRoutes from "./alertaRoutes.js";


import usuarioRoutes from "./usuarioRoutes.js";


import authRoutes from "./authRoutes.js";


// Middleware responsável por validar o token JWT.
import authMiddleware from "../middlewares/authMiddleware.js";

// Middleware responsável por verificar o perfil do usuário.
import perfilMiddleware from "../middlewares/perfilMiddleware.js";

// ==========================================
// ROTEADOR PRINCIPAL DA APLICAÇÃO
// ==========================================
// Organiza todos os módulos em um único
// roteador utilizado pelo app.js.

const router = Router();

// ==========================================
// REGISTRO DAS ROTAS - MEDIÇÕES
// ==========================================
// Endereço: /api/medicoes
router.use("/medicoes", medicaoRoutes);

// ==========================================
// REGISTRO DAS ROTAS - LOCAIS
// ==========================================
// Endereço: /api/locais
router.use("/locais", localRoutes);

// ==========================================
// REGISTRO DAS ROTAS - SETORES
// ==========================================
// Endereço: /api/setores
router.use("/setores", setorRoutes);

// ==========================================
// REGISTRO DAS ROTAS - EQUIPAMENTOS
// ==========================================
// Endereço: /api/equipamentos
router.use("/equipamentos", equipamentoRoutes);

// ==========================================
// REGISTRO DAS ROTAS - PONTOS DE MEDIÇÃO
// ==========================================
// Endereço: /api/pontos-medicao
router.use("/pontos-medicao", pontoMedicaoRoutes);

// ==========================================
// REGISTRO DAS ROTAS - DISPOSITIVOS IOT
// ==========================================
// Endereço: /api/dispositivos-iot
router.use("/dispositivos-iot", dispositivoIotRoutes);

// ==========================================
// REGISTRO DAS ROTAS - SENSORES PZEM
// ==========================================
// Endereço: /api/pzems
//
// Disponibiliza operações de cadastro,
// consulta, atualização, status e exclusão.
router.use("/pzems", pzemRoutes);



// ==========================================
// REGISTRO DAS ROTAS - EMPRESAS
// ==========================================
// Somente Administradores autenticados
// podem acessar o módulo de empresas.
router.use(
    "/empresas",
    authMiddleware,
    perfilMiddleware("Administrador"),
    empresaRoutes
);

// ==========================================
// EXPORTAÇÃO DO ROTEADOR
// ==========================================
// Exporta todas as rotas para o app.js.


// ==========================================
// REGISTRO DAS ROTAS - TARIFAS
// ==========================================
// Somente Administradores autenticados
// podem gerenciar tarifas de energia.
router.use(
    "/tarifas",
    authMiddleware,
    perfilMiddleware("Administrador"),
    tarifaRoutes
);


// ==========================================
// REGISTRO DAS ROTAS - LIMITES
// ==========================================
// Administradores e Gestores autenticados podem acessar o módulo de limites.
// No modo demonstrativo, a tela pode testar o fluxo sem usuário cadastrado.
function autenticarLimitesQuandoNecessario(req, res, next) {
    if (process.env.DEMO_MODE === "true") return next();
    return authMiddleware(req, res, (erro) => {
        if (erro) return next(erro);
        return perfilMiddleware("Administrador", "Gestor")(req, res, next);
    });
}

router.use(
    "/limites",
    autenticarLimitesQuandoNecessario,
    limiteRoutes
);


// ==========================================
// REGISTRO DAS ROTAS - ALERTAS
// ==========================================
// Administradores e Gestores autenticados
// podem acessar o módulo de alertas.
router.use(
    "/alertas",
    alertaRoutes
);


// ==========================================
// ROTAS DE USUÁRIOS
// ==========================================
router.use("/usuarios", usuarioRoutes);

// ==========================================
// AUTENTICAÇÃO DO WATT VISION
// ==========================================
router.use("/auth", authRoutes);



export default router;
