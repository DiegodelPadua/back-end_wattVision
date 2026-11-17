
import bcrypt from "bcrypt";
import usuarioRepository from "../database/monitoramento/usuarioRepository.js";

// ==========================================
// WATT VISION - SERVICE DE USUÁRIOS
// ==========================================
//
// Responsável por:
// - Validar dados de usuários;
// - Verificar empresas cadastradas;
// - Impedir e-mails duplicados;
// - Proteger senhas com bcrypt;
// - Gerenciar perfis e status.
// ==========================================

class UsuarioService {

    // ======================================
    // PADRONIZAÇÃO DOS ERROS
    // ======================================
    criarErro(mensagem, status = 400) {
        const erro = new Error(mensagem);
        erro.status = status;
        return erro;
    }

    // ======================================
    // VALIDAR IDENTIFICADORES
    // ======================================
    validarId(id, campo = "ID") {
        if (
            id === null ||
            id === undefined ||
            id === "" ||
            typeof id === "boolean"
        ) {
            throw this.criarErro(`${campo} inválido.`);
        }

        const numero = Number(id);

        if (!Number.isSafeInteger(numero) || numero <= 0) {
            throw this.criarErro(`${campo} inválido.`);
        }

        return numero;
    }

    // ======================================
    // VALIDAR NOME
    // ======================================
    validarNome(nome) {
        if (typeof nome !== "string") {
            throw this.criarErro("Nome obrigatório.");
        }

        const nomeFormatado = nome.trim();

        if (
            nomeFormatado.length < 2 ||
            nomeFormatado.length > 100
        ) {
            throw this.criarErro(
                "Nome deve conter entre 2 e 100 caracteres."
            );
        }

        return nomeFormatado;
    }

    // ======================================
    // VALIDAR E-MAIL
    // ======================================
    validarEmail(email) {
        if (typeof email !== "string") {
            throw this.criarErro("E-mail obrigatório.");
        }

        const emailFormatado = email.trim().toLowerCase();

        const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            emailFormatado.length > 100 ||
            !formatoEmail.test(emailFormatado)
        ) {
            throw this.criarErro(
                "Informe um e-mail válido, com até 100 caracteres."
            );
        }

        return emailFormatado;
    }

    // ======================================
    // VALIDAR PERFIL
    // ======================================
    validarPerfil(perfil) {
        const perfisPermitidos = [
            "Administrador",
            "Gestor"
        ];

        if (!perfisPermitidos.includes(perfil)) {
            throw this.criarErro(
                "Perfil inválido. Utilize Administrador ou Gestor."
            );
        }

        return perfil;
    }

    // ======================================
    // VALIDAR STATUS
    // ======================================
    validarStatus(status) {
        const statusPermitidos = [
            "Ativo",
            "Inativo"
        ];

        if (!statusPermitidos.includes(status)) {
            throw this.criarErro(
                "Status inválido. Utilize Ativo ou Inativo."
            );
        }

        return status;
    }

    // ======================================
    // VALIDAR SENHA
    // ======================================
    validarSenha(senha) {
        if (
            typeof senha !== "string" ||
            senha.length < 8 ||
            senha.length > 72
        ) {
            throw this.criarErro(
                "A senha deve conter entre 8 e 72 caracteres."
            );
        }

        // bcrypt trabalha com até 72 bytes.
        // Caracteres especiais podem ocupar
        // mais de um byte em UTF-8.
        if (Buffer.byteLength(senha, "utf8") > 72) {
            throw this.criarErro(
                "A senha não pode ultrapassar 72 bytes."
            );
        }

        return senha;
    }

    // ======================================
    // VERIFICAR EMPRESA
    // ======================================
    async verificarEmpresa(idEmpresa) {
        const idValidado = this.validarId(
            idEmpresa,
            "Empresa"
        );

        const empresa = await usuarioRepository.buscarEmpresaPorId(
            idValidado
        );

        if (!empresa) {
            throw this.criarErro(
                "Empresa não encontrada.",
                404
            );
        }

        return idValidado;
    }

    // ======================================
    // VERIFICAR E-MAIL DUPLICADO
    // ======================================
    async verificarEmailDisponivel(email, idAtual = null) {
        const usuario = await usuarioRepository.buscarPorEmail(
            email
        );

        if (
            usuario &&
            usuario.id !== idAtual
        ) {
            throw this.criarErro(
                "Este e-mail já está cadastrado.",
                409
            );
        }
    }

    // ======================================
    // GET - LISTAR TODOS
    // ======================================
    async listarTodos() {
        return usuarioRepository.listarTodos();
    }

    // ======================================
    // GET - BUSCAR POR ID
    // ======================================
    async buscarPorId(id) {
        const idValidado = this.validarId(
            id,
            "Usuário"
        );

        const usuario = await usuarioRepository.buscarPorId(
            idValidado
        );

        if (!usuario) {
            throw this.criarErro(
                "Usuário não encontrado.",
                404
            );
        }

        return usuario;
    }

    // ======================================
    // GET - LISTAR POR EMPRESA
    // ======================================
    async listarPorEmpresa(idEmpresa) {
        const idValidado = await this.verificarEmpresa(
            idEmpresa
        );

        return usuarioRepository.listarPorEmpresa(
            idValidado
        );
    }

    // ======================================
    // POST - CADASTRAR USUÁRIO
    // ======================================
    async criar(dados) {
        if (
            !dados ||
            typeof dados !== "object" ||
            Array.isArray(dados)
        ) {
            throw this.criarErro(
                "Dados do usuário inválidos."
            );
        }

        const id_empresa = await this.verificarEmpresa(
            dados.id_empresa
        );

        const nome = this.validarNome(dados.nome);

        const email = this.validarEmail(dados.email);

        const senha = this.validarSenha(dados.senha);

        const perfil = this.validarPerfil(
            dados.perfil ?? "Gestor"
        );

        const status = this.validarStatus(
            dados.status ?? "Ativo"
        );

        // Impede duplicação de e-mail.
        await this.verificarEmailDisponivel(email);

        // Gera o hash antes de salvar no banco.
        const senhaHash = await bcrypt.hash(senha, 12);

        const id = await usuarioRepository.criar({
            id_empresa,
            nome,
            email,
            senha: senhaHash,
            perfil,
            status
        });

        // Retorna o cadastro sem a senha.
        return usuarioRepository.buscarPorId(id);
    }

    // ======================================
    // PUT - ATUALIZAR USUÁRIO
    // ======================================
    async atualizar(id, dados) {
        const idValidado = this.validarId(
            id,
            "Usuário"
        );

        await this.buscarPorId(idValidado);

        if (
            !dados ||
            typeof dados !== "object" ||
            Array.isArray(dados)
        ) {
            throw this.criarErro(
                "Dados do usuário inválidos."
            );
        }

        const id_empresa = await this.verificarEmpresa(
            dados.id_empresa
        );

        const nome = this.validarNome(dados.nome);

        const email = this.validarEmail(dados.email);

        const perfil = this.validarPerfil(dados.perfil);

        await this.verificarEmailDisponivel(
            email,
            idValidado
        );

        await usuarioRepository.atualizar(
            idValidado,
            {
                id_empresa,
                nome,
                email,
                perfil
            }
        );

        return usuarioRepository.buscarPorId(
            idValidado
        );
    }

    // ======================================
    // PATCH - ALTERAR STATUS
    // ======================================
    async atualizarStatus(id, status) {
        const idValidado = this.validarId(
            id,
            "Usuário"
        );

        await this.buscarPorId(idValidado);

        const statusValidado = this.validarStatus(
            status
        );

        await usuarioRepository.atualizarStatus(
            idValidado,
            statusValidado
        );

        return usuarioRepository.buscarPorId(
            idValidado
        );
    }

    // ======================================
    // PATCH - ALTERAR A PRÓPRIA SENHA
    // ======================================
    async alterarMinhaSenha(idUsuario, senhaAtual, novaSenha) {
        const idValidado = this.validarId(idUsuario, "Usuário");

        if (typeof senhaAtual !== "string" || !senhaAtual) {
            throw this.criarErro("Informe a senha atual.");
        }

        const senhaNovaValidada = this.validarSenha(novaSenha);
        const usuario = await usuarioRepository.buscarCredenciaisPorId(idValidado);

        if (!usuario || usuario.status !== "Ativo") {
            throw this.criarErro("Usuário não encontrado ou inativo.", 404);
        }

        const senhaAtualCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
        if (!senhaAtualCorreta) {
            throw this.criarErro("A senha atual está incorreta.", 401);
        }

        const senhaHash = await bcrypt.hash(senhaNovaValidada, 12);
        await usuarioRepository.atualizarSenha(idValidado, senhaHash);
    }

    // ======================================
    // PATCH - RESET ADMINISTRATIVO DE SENHA
    // ======================================
    async redefinirSenha(id, novaSenha) {
        const idValidado = this.validarId(id, "Usuário");
        const senhaValidada = this.validarSenha(novaSenha);
        const usuario = await this.buscarPorId(idValidado);
        const senhaHash = await bcrypt.hash(senhaValidada, 12);

        await usuarioRepository.atualizarSenha(idValidado, senhaHash);
        return usuario;
    }


    // ======================================
    // POST - AUTORIZAR GESTOR EM UM LOCAL
    // ======================================
    // Valida os identificadores recebidos
    // e solicita ao Repository o cadastro
    // da autorização de acesso.

    async autorizarLocal(idUsuario, idLocal) {

        // Valida o identificador do usuário.
        const idUsuarioValidado = this.validarId(
            idUsuario,
            "Usuário"
        );

        // Valida o identificador do local.
        const idLocalValidado = this.validarId(
            idLocal,
            "Local"
        );

        // Confirma que o usuário existe.
        const usuario = await this.buscarPorId(
            idUsuarioValidado
        );

        // Somente Gestores podem receber
        // autorizações específicas por local.
        if (usuario.perfil !== "Gestor") {
            throw this.criarErro(
                "Somente Gestores podem receber autorizações por local.",
                403
            );
        }

        // Solicita ao Repository a associação.
        // O Repository também verifica se o
        // Gestor está ativo, se o local pertence
        // à mesma empresa e se já existe vínculo.
        const autorizado = await usuarioRepository.autorizarLocal(
            idUsuarioValidado,
            idLocalValidado
        );

        if (!autorizado) {
            throw this.criarErro(
                "Não foi possível autorizar o local. Verifique se o Gestor está ativo, se o local pertence à empresa e se a autorização já existe.",
                409
            );
        }

        return {
            id_usuario: idUsuarioValidado,
            id_local: idLocalValidado,
            autorizado: true
        };
    }


    // ======================================
    // GET - LISTAR LOCAIS AUTORIZADOS
    // ======================================
    // Consulta os locais que o Administrador
    // autorizou para determinado usuário.

    async listarLocaisAutorizados(idUsuario) {

        // Valida o identificador informado.
        const idValidado = this.validarId(
            idUsuario,
            "Usuário"
        );

        // Confirma que o usuário existe.
        await this.buscarPorId(idValidado);

        // Consulta os vínculos no banco.
        const locais =
            await usuarioRepository.listarLocaisAutorizados(
                idValidado
            );

        return locais;
    }



    // ======================================
    // VALIDAR ACESSO DO USUÁRIO AO LOCAL
    // ======================================
    // O Administrador pode acessar os locais
    // da própria empresa.
    //
    // O Gestor precisa ter autorização
    // registrada em tbl_usuario_local.

    async verificarPermissaoLocal(usuarioLogado, idLocal) {

        // Valida o identificador do local.
        const idLocalValidado = Number(idLocal);

        if (
            !Number.isSafeInteger(idLocalValidado) ||
            idLocalValidado <= 0
        ) {
            const erro = new Error("ID do local inválido.");
            erro.status = 400;
            throw erro;
        }

        // Verifica se existe usuário autenticado.
        if (!usuarioLogado) {
            const erro = new Error("Usuário não autenticado.");
            erro.status = 401;
            throw erro;
        }


        // O Administrador só pode acessar
        // locais pertencentes à sua empresa.
        if (usuarioLogado.perfil === "Administrador") {

            const pertenceEmpresa =
                await usuarioRepository.verificarLocalDaEmpresa(
                    idLocalValidado,
                    usuarioLogado.id_empresa
                );

            if (!pertenceEmpresa) {
                const erro = new Error(
                    "Acesso negado. Local não pertence à sua empresa."
                );
                erro.status = 403;
                throw erro;
            }

            return true;
        }


        // Bloqueia perfis não reconhecidos.
        if (usuarioLogado.perfil !== "Gestor") {
            const erro = new Error("Perfil sem permissão.");
            erro.status = 403;
            throw erro;
        }

        // Consulta a autorização no Repository.
        const autorizado =
            await usuarioRepository.verificarAcessoLocal(
                usuarioLogado.id,
                idLocalValidado
            );

        if (!autorizado) {
            const erro = new Error(
                "Acesso negado. Você não possui autorização para este local."
            );
            erro.status = 403;
            throw erro;
        }

        return true;
    }



    // ======================================
    // LISTAR LOCAIS DO USUÁRIO AUTENTICADO
    // ======================================
    async listarLocaisPermitidos(usuarioLogado) {

        // Confirma que existe usuário autenticado.
        if (!usuarioLogado) {
            const erro = new Error("Usuário não autenticado.");
            erro.status = 401;
            throw erro;
        }

        // Aceita somente os perfis do sistema.
        if (
            !["Administrador", "Gestor"].includes(
                usuarioLogado.perfil
            )
        ) {
            const erro = new Error("Perfil sem permissão.");
            erro.status = 403;
            throw erro;
        }

        return usuarioRepository.listarLocaisPermitidos(
            usuarioLogado
        );
    }




}

export default new UsuarioService();
