
import database from "../../config/database.js";

// ==========================================
// WATT VISION - REPOSITORY DE USUÁRIOS
// ==========================================
//
// Responsável exclusivamente pelas
// operações SQL da tabela tbl_usuario.
//
// As validações e a proteção das senhas
// serão realizadas no usuarioService.js.
// ==========================================

class UsuarioRepository {

    // ======================================
    // GET - LISTAR TODOS OS USUÁRIOS
    // ======================================
    async listarTodos() {
        const [usuarios] = await database.query(`
            SELECT
                u.id,
                u.id_empresa,
                e.razao_social AS empresa,
                u.nome,
                u.email,
                u.perfil,
                u.status,
                u.data_cadastro,
                u.ultimo_acesso
            FROM tbl_usuario u
            INNER JOIN tbl_empresa e
                ON e.id = u.id_empresa
            ORDER BY u.id DESC
        `);

        return usuarios;
    }

    // ======================================
    // GET - BUSCAR USUÁRIO POR ID
    // ======================================
    async buscarPorId(id) {
        const [usuarios] = await database.query(
            `SELECT
                id,
                id_empresa,
                nome,
                email,
                perfil,
                status,
                data_cadastro,
                ultimo_acesso
             FROM tbl_usuario
             WHERE id = ?`,
            [id]
        );

        return usuarios[0] ?? null;
    }

    // ======================================
    // GET - BUSCAR USUÁRIO POR E-MAIL
    // ======================================
    async buscarPorEmail(email) {
        const [usuarios] = await database.query(
            `SELECT
                id,
                id_empresa,
                nome,
                email,
                perfil,
                status,
                data_cadastro,
                ultimo_acesso
             FROM tbl_usuario
             WHERE email = ?`,
            [email]
        );

        return usuarios[0] ?? null;
    }

    // ======================================
    // GET - BUSCAR POR E-MAIL COM SENHA
    // ======================================
    // Método reservado para a futura
    // implementação de autenticação.
    // Nunca deve ser exposto diretamente
    // por uma rota pública.
    // ======================================
    async buscarCredenciaisPorEmail(email) {
        const [usuarios] = await database.query(
            `SELECT
                id,
                id_empresa,
                nome,
                email,
                senha,
                perfil,
                status
             FROM tbl_usuario
             WHERE email = ?`,
            [email]
        );

        return usuarios[0] ?? null;
    }

    // ======================================
    // GET - LISTAR USUÁRIOS POR EMPRESA
    // ======================================
    async listarPorEmpresa(idEmpresa) {
        const [usuarios] = await database.query(
            `SELECT
                id,
                id_empresa,
                nome,
                email,
                perfil,
                status,
                data_cadastro,
                ultimo_acesso
             FROM tbl_usuario
             WHERE id_empresa = ?
             ORDER BY nome ASC`,
            [idEmpresa]
        );

        return usuarios;
    }

    // ======================================
    // POST - CADASTRAR USUÁRIO
    // ======================================
    async criar(dados) {
        const [resultado] = await database.query(
            `INSERT INTO tbl_usuario (
                id_empresa,
                nome,
                email,
                senha,
                perfil,
                status
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                dados.id_empresa,
                dados.nome,
                dados.email,
                dados.senha,
                dados.perfil,
                dados.status
            ]
        );

        return resultado.insertId;
    }

    // ======================================
    // PUT - ATUALIZAR USUÁRIO
    // ======================================
    // A senha não é alterada nesta operação.
    // Uma rota específica poderá cuidar
    // da troca de senha futuramente.
    // ======================================
    async atualizar(id, dados) {
        const [resultado] = await database.query(
            `UPDATE tbl_usuario
             SET
                id_empresa = ?,
                nome = ?,
                email = ?,
                perfil = ?
             WHERE id = ?`,
            [
                dados.id_empresa,
                dados.nome,
                dados.email,
                dados.perfil,
                id
            ]
        );

        return resultado.affectedRows > 0;
    }

    // ======================================
    // PATCH - ATIVAR OU INATIVAR USUÁRIO
    // ======================================
    async atualizarStatus(id, status) {
        const [resultado] = await database.query(
            `UPDATE tbl_usuario
             SET status = ?
             WHERE id = ?`,
            [status, id]
        );

        return resultado.affectedRows > 0;
    }

    // ======================================
    // GET - VERIFICAR EMPRESA EXISTENTE
    // ======================================
    async buscarEmpresaPorId(idEmpresa) {
        const [empresas] = await database.query(
            `SELECT id
             FROM tbl_empresa
             WHERE id = ?`,
            [idEmpresa]
        );

        return empresas[0] ?? null;
    }

    // ======================================
    // PATCH - REGISTRAR ÚLTIMO ACESSO
    // ======================================
    async registrarUltimoAcesso(id) {
        const [resultado] = await database.query(
            `UPDATE tbl_usuario
             SET ultimo_acesso = NOW()
             WHERE id = ?`,
            [id]
        );

        return resultado.affectedRows > 0;
    }


    // ======================================
    // GET - LISTAR LOCAIS AUTORIZADOS
    // ======================================
    // Consulta os locais vinculados ao usuário
    // na tabela tbl_usuario_local.
    // A autorização efetiva será aplicada
    // nas rotas e consultas protegidas.
    async listarLocaisAutorizados(idUsuario) {
        const [locais] = await database.query(
            `SELECT
                ul.id_local
             FROM tbl_usuario_local ul
             WHERE ul.id_usuario = ?
             ORDER BY ul.id_local ASC`,
            [idUsuario]
        );

        return locais;
    }


    // ======================================
    // GET - VERIFICAR ACESSO A UM LOCAL
    // ======================================
    // Confirma se o Gestor possui autorização
    // para acessar um local específico.
    //
    // Também verifica se o usuário está ativo
    // e se o local pertence à mesma empresa.

    async verificarAcessoLocal(idUsuario, idLocal) {
        const [registros] = await database.query(
            `SELECT 1
             FROM tbl_usuario_local ul
             INNER JOIN tbl_usuario u
                 ON u.id = ul.id_usuario
             INNER JOIN tbl_local l
                 ON l.id = ul.id_local
             WHERE ul.id_usuario = ?
               AND ul.id_local = ?
               AND u.id_empresa = l.id_empresa
               AND u.perfil = 'Gestor'
               AND u.status = 'Ativo'
             LIMIT 1`,
            [idUsuario, idLocal]
        );

        return registros.length > 0;
    }



    // ======================================
    // POST - AUTORIZAR USUÁRIO EM UM LOCAL
    // ======================================
    // Registra a associação entre usuário e
    // local, desde que ambos pertençam à
    // mesma empresa e o usuário seja Gestor.
    // Evita autorizações duplicadas.
    async autorizarLocal(idUsuario, idLocal) {
        const [resultado] = await database.query(
            `INSERT INTO tbl_usuario_local (
                id_usuario,
                id_local
            )
            SELECT u.id, l.id
            FROM tbl_usuario u
            INNER JOIN tbl_local l
                ON l.id_empresa = u.id_empresa
            WHERE u.id = ?
              AND l.id = ?
              AND u.perfil = 'Gestor'
              AND u.status = 'Ativo'
              AND NOT EXISTS (
                  SELECT 1
                  FROM tbl_usuario_local ul
                  WHERE ul.id_usuario = u.id
                    AND ul.id_local = l.id
              )`,
            [idUsuario, idLocal]
        );

        return resultado.affectedRows > 0;
    }


    // ======================================
    // VERIFICAR SE LOCAL PERTENCE À EMPRESA
    // ======================================
    // Impede que um usuário acesse locais
    // pertencentes a outras empresas.

    async verificarLocalDaEmpresa(idLocal, idEmpresa) {
        const [registros] = await database.query(
            `SELECT 1
             FROM tbl_local
             WHERE id = ?
               AND id_empresa = ?
             LIMIT 1`,
            [idLocal, idEmpresa]
        );

        return registros.length > 0;
    }


    
    // ======================================
    // GET - LISTAR LOCAIS PERMITIDOS
    // ======================================
    // Administrador: locais da própria empresa.
    // Gestor: somente locais autorizados.
    // A consulta também impede que sejam
    // retornados locais de outras empresas.

    async listarLocaisPermitidos(usuario) {
        const [locais] = await database.query(
            `SELECT l.*
             FROM tbl_local l
             WHERE l.id_empresa = ?
               AND (
                   ? = 'Administrador'
                   OR (
                       ? = 'Gestor'
                       AND EXISTS (
                           SELECT 1
                           FROM tbl_usuario_local ul
                           WHERE ul.id_local = l.id
                             AND ul.id_usuario = ?
                       )
                   )
               )
             ORDER BY l.id ASC`,
            [
                usuario.id_empresa,
                usuario.perfil,
                usuario.perfil,
                usuario.id
            ]
        );

        return locais;
    }




}



export default new UsuarioRepository();
