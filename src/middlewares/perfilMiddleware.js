
 // ==========================================
 // WATT VISION - MIDDLEWARE DE PERMISSÕES
 // ==========================================
 //
 // Responsável por verificar se o perfil
 // do usuário possui autorização para
 // acessar determinada rota.
 //
 // Deve ser utilizado sempre depois
 // do authMiddleware.
 // ==========================================

function perfilMiddleware(...perfisPermitidos) {

    // Retorna o middleware que será
    // executado pelo Express.
    return (req, res, next) => {

        // Verifica se existe um usuário
        // autenticado na requisição.
        if (!req.usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário não autenticado."
            });
        }

        // Recupera o perfil do usuário
        // validado pelo authMiddleware.
        const perfilUsuario = req.usuario.perfil;

        // Verifica se o perfil está na
        // lista de perfis autorizados.
        if (!perfisPermitidos.includes(perfilUsuario)) {
            return res.status(403).json({
                sucesso: false,
                mensagem:
                    "Você não possui permissão para realizar esta operação."
            });
        }

        // Usuário autorizado.
        // Continua para o Controller.
        return next();
    };
}

export default perfilMiddleware;
