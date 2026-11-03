
import jwt from "jsonwebtoken";

import usuarioRepository from "../database/monitoramento/usuarioRepository.js";

// ==========================================
// WATT VISION - MIDDLEWARE JWT
// ==========================================
//
// Responsável por:
// - Verificar se o token foi enviado;
// - Validar a assinatura e a validade;
// - Consultar o usuário no banco;
// - Bloquear usuários inativos;
// - Disponibilizar o usuário autenticado.
//
// ==========================================

async function authMiddleware(req, res, next) {
    try {

        // Obtém o cabeçalho Authorization.
        const authorization = req.headers.authorization;

        // Verifica se foi enviado no formato:
        // Authorization: Bearer TOKEN
        if (
            !authorization ||
            !authorization.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Token de autenticação não informado."
            });
        }

        // Extrai o token enviado pelo cliente.
        const token = authorization.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Token de autenticação inválido."
            });
        }

        // Obtém a chave utilizada na assinatura.
        const chaveJwt = process.env.JWT_SECRET;

        if (!chaveJwt || chaveJwt.length < 32) {
            return res.status(500).json({
                sucesso: false,
                mensagem: "Autenticação não configurada."
            });
        }

        // Verifica assinatura e expiração do JWT.
        const dadosToken = jwt.verify(
            token,
            chaveJwt,
            {
                algorithms: ["HS256"]
            }
        );

        // Valida o identificador do usuário.
        const idUsuario = Number(dadosToken.id);

        if (
            !Number.isSafeInteger(idUsuario) ||
            idUsuario <= 0
        ) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Token de autenticação inválido."
            });
        }

        // Consulta o usuário no banco.
        const usuario = await usuarioRepository.buscarPorId(
            idUsuario
        );

        // Impede acesso de usuários excluídos
        // ou que não existem mais.
        if (!usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário não encontrado."
            });
        }

        // Bloqueia contas inativas.
        if (usuario.status !== "Ativo") {
            return res.status(403).json({
                sucesso: false,
                mensagem: "Usuário inativo. Acesso bloqueado."
            });
        }

        // Disponibiliza os dados atuais do
        // usuário para os próximos Controllers.
        // Não utiliza o perfil antigo do token.
        req.usuario = {
            id: usuario.id,
            id_empresa: usuario.id_empresa,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil
        };

        // Autoriza a continuidade da requisição.
        return next();

    } catch (erro) {

        // Token expirado.
        if (erro.name === "TokenExpiredError") {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Sessão expirada. Faça login novamente."
            });
        }

        // Token inválido ou adulterado.
        if (erro.name === "JsonWebTokenError") {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Token de autenticação inválido."
            });
        }

        // Outros erros, incluindo falhas no banco.
        console.error(
            "[AUTH] Erro no middleware:",
            erro.message
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno na autenticação."
        });
    }
}

export default authMiddleware;
