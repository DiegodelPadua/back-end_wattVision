
import usuarioService from "../services/usuarioService.js";

// ==========================================
// WATT VISION - CONTROLLER DE USUÁRIOS
// ==========================================
//
// Responsabilidades:
// - Receber requisições HTTP;
// - Chamar os métodos do UsuarioService;
// - Retornar respostas JSON padronizadas;
// - Tratar erros de validação e do banco.
//
// As consultas SQL ficam no Repository.
// As regras de negócio ficam no Service.
// ==========================================

class UsuarioController {

    // ======================================
    // TRATAMENTO PADRONIZADO DE ERROS
    // ======================================
    tratarErro(erro, res, contexto) {

        // Registra o erro no terminal do backend.
        console.error(`[USUÁRIOS] ${contexto}:`, erro);

        // Verifica se o Service informou
        // um código HTTP válido.
        let status =
            Number.isInteger(erro.status) &&
            erro.status >= 400 &&
            erro.status <= 599
                ? erro.status
                : 500;

        let mensagem = erro.message;

        // MySQL: tentativa de cadastrar
        // um e-mail que já existe.
        if (erro.code === "ER_DUP_ENTRY") {
            status = 409;
            mensagem = "Este e-mail já está cadastrado.";
        }

        // Evita revelar detalhes internos
        // do servidor ao cliente.
        if (status === 500) {
            mensagem = "Erro interno ao processar usuário.";
        }

        return res.status(status).json({
            sucesso: false,
            mensagem
        });
    }

    // ======================================
    // GET - LISTAR TODOS OS USUÁRIOS
    // ======================================
    async listarTodos(req, res) {
        try {
            const usuarios = await usuarioService.listarTodos();

            return res.status(200).json({
                sucesso: true,
                quantidade: usuarios.length,
                dados: usuarios
            });

        } catch (erro) {
            return this.tratarErro(
                erro,
                res,
                "Erro ao listar usuários"
            );
        }
    }

    // ======================================
    // GET - BUSCAR USUÁRIO POR ID
    // ======================================
    async buscarPorId(req, res) {
        try {
            const usuario = await usuarioService.buscarPorId(
                req.params.id
            );

            return res.status(200).json({
                sucesso: true,
                dados: usuario
            });

        } catch (erro) {
            return this.tratarErro(
                erro,
                res,
                "Erro ao buscar usuário"
            );
        }
    }

    // ======================================
    // GET - LISTAR USUÁRIOS POR EMPRESA
    // ======================================
    async listarPorEmpresa(req, res) {
        try {
            const usuarios = await usuarioService.listarPorEmpresa(
                req.params.idEmpresa
            );

            return res.status(200).json({
                sucesso: true,
                quantidade: usuarios.length,
                dados: usuarios
            });

        } catch (erro) {
            return this.tratarErro(
                erro,
                res,
                "Erro ao listar usuários da empresa"
            );
        }
    }

    // ======================================
    // POST - CADASTRAR USUÁRIO
    // ======================================
    async criar(req, res) {
        try {
            const usuario = await usuarioService.criar(
                req.body
            );

            return res.status(201).json({
                sucesso: true,
                mensagem: "Usuário cadastrado com sucesso.",
                dados: usuario
            });

        } catch (erro) {
            return this.tratarErro(
                erro,
                res,
                "Erro ao cadastrar usuário"
            );
        }
    }

    // ======================================
    // PUT - ATUALIZAR USUÁRIO
    // ======================================
    async atualizar(req, res) {
        try {
            const usuario = await usuarioService.atualizar(
                req.params.id,
                req.body
            );

            return res.status(200).json({
                sucesso: true,
                mensagem: "Usuário atualizado com sucesso.",
                dados: usuario
            });

        } catch (erro) {
            return this.tratarErro(
                erro,
                res,
                "Erro ao atualizar usuário"
            );
        }
    }

    // ======================================
    // PATCH - ATIVAR OU INATIVAR USUÁRIO
    // ======================================
    async atualizarStatus(req, res) {
        try {
            const usuario = await usuarioService.atualizarStatus(
                req.params.id,
                req.body?.status
            );

            return res.status(200).json({
                sucesso: true,
                mensagem: "Status do usuário atualizado com sucesso.",
                dados: usuario
            });

        } catch (erro) {
            return this.tratarErro(
                erro,
                res,
                "Erro ao atualizar status do usuário"
            );
        }
    }

    // ======================================
    // PATCH - ALTERAR A PRÓPRIA SENHA
    // ======================================
    async alterarMinhaSenha(req, res) {
        try {
            await usuarioService.alterarMinhaSenha(
                req.usuario.id,
                req.body?.senhaAtual,
                req.body?.novaSenha
            );

            return res.status(200).json({
                sucesso: true,
                mensagem: "Senha alterada com sucesso."
            });
        } catch (erro) {
            return this.tratarErro(erro, res, "Erro ao alterar senha");
        }
    }

    // ======================================
    // PATCH - RESET ADMINISTRATIVO DE SENHA
    // ======================================
    async redefinirSenha(req, res) {
        try {
            await usuarioService.redefinirSenha(
                req.params.id,
                req.body?.novaSenha
            );

            return res.status(200).json({
                sucesso: true,
                mensagem: "Senha redefinida com sucesso."
            });
        } catch (erro) {
            return this.tratarErro(erro, res, "Erro ao redefinir senha");
        }
    }


    // ======================================
    // POST - AUTORIZAR GESTOR EM UM LOCAL
    // ======================================
    // Recebe a solicitação do Administrador
    // e encaminha os dados para o Service.

    async autorizarLocal(req, res) {
        try {
            // Identificadores recebidos pela rota.
            const { idUsuario, idLocal } = req.params;

            // Solicita ao Service o registro
            // da autorização.
            const autorizacao =
                await usuarioService.autorizarLocal(
                    idUsuario,
                    idLocal
                );

            return res.status(201).json({
                sucesso: true,
                mensagem: "Local autorizado com sucesso.",
                dados: autorizacao
            });

        } catch (erro) {
            return res.status(erro.status || 500).json({
                sucesso: false,
                mensagem: erro.message
            });
        }
    }


    // ======================================
    // GET - LISTAR LOCAIS AUTORIZADOS
    // ======================================
    async listarLocaisAutorizados(req, res) {
        try {
            const { idUsuario } = req.params;

            const locais =
                await usuarioService.listarLocaisAutorizados(
                    idUsuario
                );

            return res.status(200).json({
                sucesso: true,
                mensagem: "Locais autorizados consultados com sucesso.",
                dados: locais
            });

        } catch (erro) {
            return res.status(erro.status || 500).json({
                sucesso: false,
                mensagem: erro.message
            });
        }
    }


}

export default new UsuarioController();
