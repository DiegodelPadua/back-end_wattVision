
import authService from "../services/authService.js";

// ==========================================
// WATT VISION - CONTROLLER DE AUTENTICAÇÃO
// ==========================================
//
// Responsabilidades:
// - Receber as requisições de login;
// - Enviar os dados para o AuthService;
// - Retornar o token JWT;
// - Tratar erros de autenticação.
//
// As validações de senha e a geração do
// token são realizadas no AuthService.
// ==========================================

class AuthController {

    // ======================================
    // POST - REALIZAR LOGIN
    // ======================================
    async login(req, res) {
        try {

            // Recebe o e-mail e a senha enviados
            // pelo usuário no corpo da requisição.
            const { email, senha } = req.body ?? {};

            // Envia as credenciais para o Service,
            // responsável por verificar os dados.
            const resultado = await authService.login({
                email,
                senha
            });

            // Retorna o token e os dados do usuário.
            // A senha não é enviada na resposta.
            return res.status(200).json({
                sucesso: true,
                mensagem: "Login realizado com sucesso.",
                dados: resultado
            });

        } catch (erro) {

            // Registra o erro no terminal.
            // Não registra senhas nem tokens.
            console.error(
                "[AUTH] Erro ao realizar login:",
                erro.message
            );

            // Utiliza o status definido no Service.
            const status =
                Number.isInteger(erro.status) &&
                erro.status >= 400 &&
                erro.status <= 599
                    ? erro.status
                    : 500;

            // Evita expor informações internas
            // quando ocorrer erro no servidor.
            const mensagem = status === 500
                ? "Erro interno ao realizar login."
                : erro.message;

            return res.status(status).json({
                sucesso: false,
                mensagem
            });
        }
    }
}

export default new AuthController();
