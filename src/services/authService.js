
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import usuarioRepository from "../database/monitoramento/usuarioRepository.js";

// ==========================================
// WATT VISION - SERVICE DE AUTENTICAÇÃO
// ==========================================
//
// Responsável por:
// - Validar e-mail e senha;
// - Consultar o usuário cadastrado;
// - Comparar a senha com o hash bcrypt;
// - Verificar se o usuário está ativo;
// - Gerar um token JWT;
// - Registrar o último acesso.
// ==========================================

class AuthService {

    // ======================================
    // PADRONIZAR ERROS
    // ======================================
    criarErro(mensagem, status = 400) {
        const erro = new Error(mensagem);
        erro.status = status;
        return erro;
    }

    // ======================================
    // LOGIN DO USUÁRIO
    // ======================================
    async login(dados) {

        // Verifica se os dados foram enviados.
        if (
            !dados ||
            typeof dados !== "object" ||
            Array.isArray(dados)
        ) {
            throw this.criarErro(
                "Informe o e-mail e a senha."
            );
        }

        const { email, senha } = dados;

        // Valida o e-mail.
        if (
            typeof email !== "string" ||
            !email.trim()
        ) {
            throw this.criarErro(
                "E-mail obrigatório."
            );
        }

        // Valida a senha.
        if (
            typeof senha !== "string" ||
            !senha
        ) {
            throw this.criarErro(
                "Senha obrigatória."
            );
        }

        const emailFormatado = email.trim().toLowerCase();

        // Consulta o usuário no banco.
        // Este método retorna o hash da senha
        // exclusivamente para autenticação.
        const usuario =
            await usuarioRepository.buscarCredenciaisPorEmail(
                emailFormatado
            );

        // Mensagem genérica para não revelar
        // se determinado e-mail está cadastrado.
        if (!usuario) {
            throw this.criarErro(
                "E-mail ou senha inválidos.",
                401
            );
        }

        // Compara a senha informada com
        // o hash armazenado no MySQL.
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaCorreta) {
            throw this.criarErro(
                "E-mail ou senha inválidos.",
                401
            );
        }

        // Impede o login de contas inativas.
        if (usuario.status !== "Ativo") {
            throw this.criarErro(
                "Usuário inativo. Acesso não permitido.",
                403
            );
        }

        // Verifica se a chave JWT está configurada.
        const chaveJwt = process.env.JWT_SECRET;

        if (!chaveJwt || chaveJwt.length < 32) {
            throw this.criarErro(
                "Configuração de autenticação indisponível.",
                500
            );
        }

        // Gera um token com os dados mínimos
        // necessários para identificar o usuário.
        const token = jwt.sign(
            {
                id: usuario.id,
                id_empresa: usuario.id_empresa,
                perfil: usuario.perfil
            },
            chaveJwt,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "8h",
                algorithm: "HS256"
            }
        );

        // Registra a data e hora do login.
        await usuarioRepository.registrarUltimoAcesso(
            usuario.id
        );

        // Retorna os dados públicos e o token.
        // A senha nunca é devolvida.
        return {
            token,
            tipo: "Bearer",
            usuario: {
                id: usuario.id,
                id_empresa: usuario.id_empresa,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil,
                status: usuario.status
            }
        };
    }
}

export default new AuthService();
